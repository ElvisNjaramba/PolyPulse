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

    new_balance = profile.balance + amount

    if new_balance < 0:
        raise ValueError("Insufficient balance")

    profile.balance = new_balance
    profile.save(update_fields=["balance"])

    WalletTransaction.objects.create(
        user=user,
        amount=amount,
        transaction_type=transaction_type,
        related_poll=poll,
        related_bet=bet,
        balance_after=new_balance,
        description=description,
    )

    return new_balance
