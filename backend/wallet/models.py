from django.db import models
from django.conf import settings
from django.utils import timezone

User = settings.AUTH_USER_MODEL


class WalletTransaction(models.Model):
    TRANSACTION_TYPES = (
        ("deposit", "Deposit"),
        ("bet", "Bet Placed"),
        ("win", "Bet Win"),
        ("refund", "Refund"),
        ("admin_adjustment", "Admin Adjustment"),
    )

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="wallet_transactions"
    )

    amount = models.IntegerField()  
    # Positive = credit, Negative = debit

    transaction_type = models.CharField(
        max_length=20,
        choices=TRANSACTION_TYPES
    )

    related_poll = models.ForeignKey(
        "base.Poll",
        null=True,
        blank=True,
        on_delete=models.SET_NULL
    )

    related_bet = models.ForeignKey(
        "base.Bet",
        null=True,
        blank=True,
        on_delete=models.SET_NULL
    )

    balance_after = models.IntegerField()

    description = models.CharField(max_length=255, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user} | {self.transaction_type} | {self.amount}"
