from .models import WalletTransaction
from django.contrib.auth.models import User
from rest_framework import serializers

class WalletTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = WalletTransaction
        fields = [
            "id",
            "amount",
            "transaction_type",
            "description",
            "balance_after",
            "created_at",
        ]
