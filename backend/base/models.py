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

    def is_yes(self):
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
    poll = models.OneToOneField(Poll, related_name="market", on_delete=models.CASCADE)

    yes_shares = models.FloatField(default=0)
    no_shares = models.FloatField(default=0)
    liquidity_b = models.FloatField(default=100.0)

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _cost(self, yes, no):
        """
        LMSR cost function with log-sum-exp trick for numerical stability.

        Naive:  b * log(exp(yes/b) + exp(no/b))
        Problem: exp() overflows when yes/b > ~709 (i.e. yes > 70 900 with b=100).

        Fix: factor out max(yes, no) before exponentiation so the larger
        argument is always exp(0) = 1, keeping values tiny.
        """
        b = self.liquidity_b
        a = max(yes, no)   # baseline to keep exponents small
        return a + b * math.log(
            math.exp((yes - a) / b) + math.exp((no - a) / b)
        )

    # ------------------------------------------------------------------
    # Pricing
    # ------------------------------------------------------------------

    def price_yes(self):
        """Probability / price of YES (0–1). Uses softmax = LMSR marginal cost."""
        b = self.liquidity_b
        # Subtract max for stability (same trick as _cost)
        a = max(self.yes_shares, self.no_shares)
        exp_yes = math.exp((self.yes_shares - a) / b)
        exp_no  = math.exp((self.no_shares  - a) / b)
        return exp_yes / (exp_yes + exp_no)

    def price_no(self):
        return 1.0 - self.price_yes()

    # ------------------------------------------------------------------
    # Trading
    # ------------------------------------------------------------------

    def buy(self, is_yes: bool, amount: float):
        """
        Buy YES or NO shares by spending exactly `amount` dollars.

        LMSR buy derivation
        -------------------
        We want to find shares s such that:
            C(q_yes + s, q_no) - C(q_yes, q_no) = amount   [YES case]

        Because C = b*log(exp(q_yes/b) + exp(q_no/b)), adding `amount` to
        the cost means the new "weight sum" W' = exp(new_cost/b).

        For YES:
            exp((q_yes + s)/b) + exp(q_no/b) = W'
            => s = b * log(W' - exp(q_no/b)) - q_yes

        Returns
        -------
        (shares_issued: float, current_price: float)
        """
        b = self.liquidity_b
        q_yes = self.yes_shares
        q_no  = self.no_shares

        old_cost = self._cost(q_yes, q_no)
        new_cost = old_cost + amount

        # Use the log-sum-exp baseline to compute W' = exp(new_cost/b) safely.
        # W' can be huge, but we only ever subtract exp(q_no/b) or exp(q_yes/b)
        # from it, and then take log — so we keep working in log space.
        #
        # log(W' - exp(q_no/b))
        #   = log(exp(new_cost/b) - exp(q_no/b))
        #   = new_cost/b + log(1 - exp((q_no - new_cost)/b))   [q_no < new_cost always]
        #
        # This stays finite as long as new_cost > q_no, which is guaranteed
        # because new_cost = old_cost + amount > old_cost >= q_no (LMSR property).

        if is_yes:
            log_inner = new_cost / b + math.log(1.0 - math.exp((q_no - new_cost) / b))
            shares = b * log_inner - q_yes
            self.yes_shares += shares
        else:
            log_inner = new_cost / b + math.log(1.0 - math.exp((q_yes - new_cost) / b))
            shares = b * log_inner - q_no
            self.no_shares += shares

        self.save()

        MarketPriceSnapshot.objects.create(
            market=self,
            yes_price=self.price_yes(),
            no_price=self.price_no(),
        )

        return shares, self.price_yes() if is_yes else self.price_no()

    def sell(self, is_yes: bool, shares: float):
        """
        Sell `shares` YES or NO shares back to the market.

        The refund is simply the decrease in the cost function — no fee taken.

        Returns
        -------
        dict with keys: refund, yes_price, no_price
        """
        if shares <= 0:
            raise ValueError("Shares must be positive.")
        if is_yes and self.yes_shares < shares:
            raise ValueError(f"Not enough YES shares in market (have {self.yes_shares:.4f}).")
        if not is_yes and self.no_shares < shares:
            raise ValueError(f"Not enough NO shares in market (have {self.no_shares:.4f}).")

        old_cost = self._cost(self.yes_shares, self.no_shares)

        if is_yes:
            self.yes_shares -= shares
        else:
            self.no_shares -= shares

        new_cost = self._cost(self.yes_shares, self.no_shares)

        # old_cost > new_cost always when selling, so refund is positive.
        refund = old_cost - new_cost

        self.save()

        MarketPriceSnapshot.objects.create(
            market=self,
            yes_price=self.price_yes(),
            no_price=self.price_no(),
        )

        return {
            "refund": refund,
            "yes_price": self.price_yes(),
            "no_price": self.price_no(),
        }


class MarketPosition(models.Model):
    user   = models.ForeignKey(User, on_delete=models.CASCADE)
    market = models.ForeignKey(Market, on_delete=models.CASCADE)

    yes_shares = models.FloatField(default=0)
    no_shares  = models.FloatField(default=0)

    yes_spent = models.FloatField(default=0)
    no_spent  = models.FloatField(default=0)

    class Meta:
        unique_together = ("user", "market")

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
    CHOICES = [
        ('yes', 'Yes'),
        ('no',  'No'),
    ]

    creator  = models.ForeignKey(User, on_delete=models.CASCADE, related_name='challenges_created')
    opponent = models.ForeignKey(User, on_delete=models.CASCADE, related_name='challenges_received')
    creator_choice = models.CharField(max_length=3, choices=CHOICES, default='yes')
    amount   = models.DecimalField(max_digits=10, decimal_places=2)
    question = models.CharField(max_length=255)
    status   = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    expires_at = models.DateTimeField()
    winner   = models.ForeignKey(
        User, null=True, blank=True, on_delete=models.SET_NULL, related_name='challenges_won'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.creator} vs {self.opponent} – {self.amount}"