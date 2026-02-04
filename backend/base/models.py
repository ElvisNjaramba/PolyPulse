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
    category = models.ForeignKey(PollCategory, on_delete=models.SET_NULL, null=True, blank=True, related_name="polls")


    is_free = models.BooleanField(default=False)
    min_bet = models.IntegerField(default=10)
    winning_option = models.ForeignKey("PollOption", null=True, blank=True, on_delete=models.SET_NULL, related_name="won_polls")

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
        first = self.poll.options.order_by("id").first()
        return self.id == first.id


# class Bet(models.Model):
#     user = models.ForeignKey(User, on_delete=models.CASCADE)
#     poll = models.ForeignKey(Poll, on_delete=models.CASCADE)
#     option = models.ForeignKey(PollOption, on_delete=models.CASCADE)

#     amount = models.IntegerField()  # money spent
#     shares = models.FloatField(default=0.0)  # 🔥 NEW

#     created_at = models.DateTimeField(auto_now_add=True)

class Bet(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    poll = models.ForeignKey(Poll, on_delete=models.CASCADE, related_name="bets")
    option = models.ForeignKey(
        PollOption,
        on_delete=models.CASCADE,
        related_name="bets"   # ✅ ADD THIS
    )

    amount = models.IntegerField()
    shares = models.FloatField(default=0.0)
    created_at = models.DateTimeField(auto_now_add=True)


class PollComment(models.Model):
    poll = models.ForeignKey(
        Poll,
        on_delete=models.CASCADE,
        related_name="comments"
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE
    )

    parent = models.ForeignKey(
        "self",
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name="replies"
    )
    is_hidden = models.BooleanField(default=False)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return f"{self.user.username}: {self.content[:30]}"

class CommentLike(models.Model):
    comment = models.ForeignKey(
        PollComment,
        on_delete=models.CASCADE,
        related_name="likes"
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("comment", "user")


class Notification(models.Model):
    NOTIFICATION_TYPES = (
        ("mention", "Mention"),
        ("bet_won", "Bet Won"),
        ("bet_refunded", "Bet Refunded"),
        ("poll_resolved", "Poll Resolved"),
    )

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="notifications"
    )

    actor = models.ForeignKey(
        User,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="actions"
    )

    notification_type = models.CharField(
        max_length=30,
        choices=NOTIFICATION_TYPES
    )

    message = models.CharField(max_length=255)
    is_read = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user} - {self.notification_type}"



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

    def _cost(self, yes, no):
        b = self.liquidity_b
        return b * math.log(
            math.exp(yes / b) + math.exp(no / b)
        )

    def price_yes(self):
        b = self.liquidity_b
        return math.exp(self.yes_shares / b) / (
            math.exp(self.yes_shares / b) +
            math.exp(self.no_shares / b)
        )

    def price_no(self):
        return 1 - self.price_yes()

    def buy(self, is_yes, amount):
        old_cost = self._cost(self.yes_shares, self.no_shares)

        if is_yes:
            self.yes_shares += amount
        else:
            self.no_shares += amount

        new_cost = self._cost(self.yes_shares, self.no_shares)
        cost_paid = new_cost - old_cost

        self.save()

        MarketPriceSnapshot.objects.create(
            market=self,
            yes_price=self.price_yes(),
            no_price=self.price_no(),
        )

        return cost_paid, self.price_yes() if is_yes else self.price_no()


    def sell(self, is_yes: bool, amount: float):
        """
        Sell YES or NO shares
        """

        if amount <= 0:
            raise ValueError("Amount must be positive")

        if is_yes and self.yes_shares < amount:
            raise ValueError("Not enough YES shares in market")

        if not is_yes and self.no_shares < amount:
            raise ValueError("Not enough NO shares in market")

        old_cost = self._cost(self.yes_shares, self.no_shares)

        if is_yes:
            self.yes_shares -= amount
        else:
            self.no_shares -= amount

        new_cost = self._cost(self.yes_shares, self.no_shares)

        refund = old_cost - new_cost

        self.save()

        # 📊 snapshot AFTER trade
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
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    market = models.ForeignKey(Market, on_delete=models.CASCADE)

    yes_shares = models.FloatField(default=0)
    no_shares = models.FloatField(default=0)

    
    yes_spent = models.FloatField(default=0)  
    no_spent = models.FloatField(default=0)

    class Meta:
        unique_together = ("user", "market")

    def avg_yes_price(self):
        return self.yes_spent / self.yes_shares if self.yes_shares else 0

    def avg_no_price(self):
        return self.no_spent / self.no_shares if self.no_shares else 0
    
class MarketPriceSnapshot(models.Model):
    market = models.ForeignKey(
        Market,
        on_delete=models.CASCADE,
        related_name="price_history"
    )

    yes_price = models.FloatField()
    no_price = models.FloatField()

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]

