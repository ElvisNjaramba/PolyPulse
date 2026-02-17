from django.db import transaction
from .models import WalletTransaction

@transaction.atomic
def apply_wallet_transaction(
    *,
    user,
    amount,
    transaction_type,
    description="",
    poll=None,
    bet=None,
):
    profile = user.profile

    # Extract numeric value if amount is a dict
    if isinstance(amount, dict):
        amount = float(amount.get("value", 0))

    # Validate amount is numeric
    if not isinstance(amount, (int, float)):
        raise TypeError(f"Expected 'amount' to be int or float, got {type(amount)}")

    new_balance = profile.balance + float(amount)

    if new_balance < 0:
        raise ValueError("Insufficient balance")

    profile.balance = new_balance
    profile.save(update_fields=["balance"])

    WalletTransaction.objects.create(
        user=user,
        amount=float(amount),
        transaction_type=transaction_type,
        related_poll=poll,
        related_bet=bet,
        balance_after=new_balance,
        description=description,
    )

    return new_balance
