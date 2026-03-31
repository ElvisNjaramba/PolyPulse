import math
from django.db import models
from django.conf import settings
from django.utils import timezone


class PollCategory(models.Model):
    name = models.CharField(max_length=50, unique=True)
    slug = models.SlugField(unique=True)

    def __str__(self):
        return self.name


User = settings.AUTH_USER_MODEL


class Poll(models.Model):
    STATUS_CHOICES = (
        ("open", "Open"),
        ("closed", "Closed"),
        ("resolved", "Resolved"),
        ("suspended", "Suspended"),
    )

    creator = models.ForeignKey(User, on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    resolution_criteria = models.TextField(
    blank=True,
    help_text="Conditions that must be met before this market can be resolved."
)
    category = models.ForeignKey(
        PollCategory, on_delete=models.SET_NULL, null=True, blank=True, related_name="polls"
    )

    is_free = models.BooleanField(default=False)
    min_bet = models.IntegerField(default=10)
    winning_option = models.ForeignKey(
        "PollOption", null=True, blank=True, on_delete=models.SET_NULL, related_name="won_polls"
    )

    closes_at = models.DateTimeField()
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default="open")
    created_at = models.DateTimeField(auto_now_add=True)

    def can_accept_bets(self):
        return self.status == "open" and timezone.now() < self.closes_at

    def close_if_expired(self):
        if self.status == "open" and timezone.now() >= self.closes_at:
            self.status = "closed"
            self.save(update_fields=["status"])


class PollOption(models.Model):
    poll = models.ForeignKey(Poll, related_name="options", on_delete=models.CASCADE)
    text = models.CharField(max_length=255)
    order = models.PositiveSmallIntegerField(default=0)  # display order

    class Meta:
        ordering = ["order"]

    def is_yes(self):
        """Legacy helper — True only for classic binary Yes/No markets."""
        return self.text.strip().lower() == "yes"


class Bet(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    poll = models.ForeignKey(Poll, on_delete=models.CASCADE, related_name="bets")
    option = models.ForeignKey(PollOption, on_delete=models.CASCADE, related_name="bets")

    amount = models.FloatField()   # changed from IntegerField so free bets (1.0) and partial amounts store cleanly
    shares = models.FloatField(default=0.0)
    created_at = models.DateTimeField(auto_now_add=True)


class PollComment(models.Model):
    poll = models.ForeignKey(Poll, on_delete=models.CASCADE, related_name="comments")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    parent = models.ForeignKey(
        "self", null=True, blank=True, on_delete=models.CASCADE, related_name="replies"
    )
    is_hidden = models.BooleanField(default=False)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return f"{self.user.username}: {self.content[:30]}"


class CommentLike(models.Model):
    comment = models.ForeignKey(PollComment, on_delete=models.CASCADE, related_name="likes")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("comment", "user")


class Notification(models.Model):
    NOTIFICATION_TYPES = (
        ("mention", "Mention"),
        ("bet_won", "Bet Won"),
        ("bet_refunded", "Bet Refunded"),
        ("poll_resolved", "Poll Resolved"),
        ("challenge_accepted", "Challenge Accepted"),
        ("challenge_won", "Challenge Won"),
        ("challenge_lost", "Challenge Lost"),
        ("challenge_cancelled", "Challenge Cancelled"),
        ("challenge_received", "Challenge Received"),
        ("market_challenge", "Market Challenge"),
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="notifications")
    actor = models.ForeignKey(
        User, null=True, blank=True, on_delete=models.SET_NULL, related_name="actions"
    )
    notification_type = models.CharField(max_length=30, choices=NOTIFICATION_TYPES)
    message = models.CharField(max_length=255)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user} - {self.notification_type}"


# Position is unused — kept only so existing migrations don't break.
# Do not use this model; use MarketPosition instead.
class Position(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    poll = models.ForeignKey(Poll, on_delete=models.CASCADE)
    option = models.ForeignKey(PollOption, on_delete=models.CASCADE)
    shares = models.FloatField(default=0)

    class Meta:
        unique_together = ("user", "poll", "option")


class Market(models.Model):
    """
    Multi-outcome LMSR market maker.
    Each PollOption maps to one entry in the JSON `shares` dict:
        { "<option_id>": <float>, ... }
    Binary Yes/No markets are just the two-option case.
    """
    poll = models.OneToOneField(Poll, related_name="market", on_delete=models.CASCADE)
    shares = models.JSONField(default=dict)   # {str(option_id): float}
    liquidity_b = models.FloatField(default=100.0)

    # ── legacy columns kept so existing migrations don't break ──────────
    yes_shares = models.FloatField(default=0)
    no_shares  = models.FloatField(default=0)
    # ────────────────────────────────────────────────────────────────────

    def _get_q(self):
        """Return share vector as list[float] in option order."""
        return [
            self.shares.get(str(opt.id), 0.0)
            for opt in self.poll.options.all()
        ]

    def _cost(self, q):
        """N-option LMSR cost with log-sum-exp stability."""
        b = self.liquidity_b
        a = max(q)
        return a + b * math.log(sum(math.exp((qi - a) / b) for qi in q))

    def price_for_option(self, option):
        """Probability/price (0–1) for one option."""
        q = self._get_q()
        b = self.liquidity_b
        a = max(q)
        exps = [math.exp((qi - a) / b) for qi in q]
        total = sum(exps)
        idx = list(self.poll.options.values_list("id", flat=True)).index(option.id)
        return exps[idx] / total

    # ── Legacy binary helpers (works for 2-option markets) ──────────────
    def price_yes(self):
        opts = list(self.poll.options.all())
        if not opts:
            return 0.5
        return self.price_for_option(opts[0])

    def price_no(self):
        return 1.0 - self.price_yes()
    # ────────────────────────────────────────────────────────────────────

    def buy(self, option, amount: float):
        """
        Buy shares in `option` by spending exactly `amount`.
        Returns (shares_issued: float, new_price: float).
        """
        q = self._get_q()
        option_ids = list(self.poll.options.values_list("id", flat=True))
        idx = option_ids.index(option.id)

        b = self.liquidity_b
        old_cost = self._cost(q)
        new_cost = old_cost + amount

        # For option at idx:  exp((q[idx]+s)/b) + rest = exp(new_cost/b)
        rest_sum = sum(math.exp((q[i] - new_cost) / b) for i in range(len(q)) if i != idx)
        log_inner = new_cost / b + math.log(max(1.0 - rest_sum, 1e-15))
        shares = b * log_inner - q[idx]

        q[idx] += shares
        self.shares = {str(oid): q[i] for i, oid in enumerate(option_ids)}

        # sync legacy columns for binary markets
        if len(option_ids) == 2:
            self.yes_shares = q[0]
            self.no_shares  = q[1]

        self.save()

        new_price = self.price_for_option(option)
        MarketPriceSnapshot.objects.create(
            market=self,
            yes_price=self.price_yes(),
            no_price=self.price_no(),
        )
        return shares, new_price

    def sell(self, option, shares: float):
        """
        Sell `shares` of `option` back to the market.
        Returns dict with refund, yes_price, no_price.
        """
        if shares <= 0:
            raise ValueError("Shares must be positive.")

        option_ids = list(self.poll.options.values_list("id", flat=True))
        idx = option_ids.index(option.id)
        q = self._get_q()

        if q[idx] < shares:
            raise ValueError(f"Not enough shares in market (have {q[idx]:.4f}).")

        old_cost = self._cost(q)
        q[idx] -= shares
        new_cost = self._cost(q)
        refund = old_cost - new_cost

        self.shares = {str(oid): q[i] for i, oid in enumerate(option_ids)}
        if len(option_ids) == 2:
            self.yes_shares = q[0]
            self.no_shares  = q[1]

        self.save()
        MarketPriceSnapshot.objects.create(
            market=self,
            yes_price=self.price_yes(),
            no_price=self.price_no(),
        )
        return {"refund": refund, "yes_price": self.price_yes(), "no_price": self.price_no()}


class MarketPosition(models.Model):
    user   = models.ForeignKey(User, on_delete=models.CASCADE)
    market = models.ForeignKey(Market, on_delete=models.CASCADE)
    # Multi-option storage: { str(option_id): float }
    option_shares = models.JSONField(default=dict)
    option_spent  = models.JSONField(default=dict)

    # Legacy binary columns — kept for backwards compatibility
    yes_shares = models.FloatField(default=0)
    no_shares  = models.FloatField(default=0)
    yes_spent  = models.FloatField(default=0)
    no_spent   = models.FloatField(default=0)

    class Meta:
        unique_together = ("user", "market")

    def shares_for(self, option):
        return self.option_shares.get(str(option.id), 0.0)

    def spent_for(self, option):
        return self.option_spent.get(str(option.id), 0.0)

    def avg_price_for(self, option):
        s = self.shares_for(option)
        return self.spent_for(option) / s if s else 0

    # Legacy helpers
    def avg_yes_price(self):
        return self.yes_spent / self.yes_shares if self.yes_shares else 0

    def avg_no_price(self):
        return self.no_spent / self.no_shares if self.no_shares else 0


class MarketPriceSnapshot(models.Model):
    market = models.ForeignKey(Market, on_delete=models.CASCADE, related_name="price_history")

    yes_price = models.FloatField()
    no_price  = models.FloatField()

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]


class Challenge(models.Model):
    STATUS_CHOICES = (
        ('pending',   'Pending'),
        ('accepted',  'Accepted'),
        ('resolved',  'Resolved'),
        ('cancelled', 'Cancelled'),
        ('expired',   'Expired'),
    )
    # CHOICES = [
    #     ('yes', 'Yes'),
    #     ('no',  'No'),
    # ]

    creator  = models.ForeignKey(User, on_delete=models.CASCADE, related_name='challenges_created')
    opponent = models.ForeignKey(User, on_delete=models.CASCADE, related_name='challenges_received')
    creator_choice = models.CharField(
        max_length=255,
        help_text="The option text the creator is backing"
    )
    amount   = models.DecimalField(max_digits=10, decimal_places=2)
    question = models.CharField(max_length=255)
    is_open = models.BooleanField(default=False, help_text="Open challenge anyone can accept")
    poll = models.ForeignKey(
        'Poll', null=True, blank=True, on_delete=models.SET_NULL, related_name='challenges'
    )
    status   = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    expires_at = models.DateTimeField()
    winner   = models.ForeignKey(
        User, null=True, blank=True, on_delete=models.SET_NULL, related_name='challenges_won'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.creator} vs {self.opponent} – {self.amount}"