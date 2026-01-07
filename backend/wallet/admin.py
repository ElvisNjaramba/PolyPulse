from django.contrib import admin
from .models import WalletTransaction
from django.db import transaction

@admin.register(WalletTransaction)
class WalletTransactionAdmin(admin.ModelAdmin):
    readonly_fields = ("balance_after", "created_at")
    def save_model(self, request, obj, form, change):
        if not change:
            with transaction.atomic():
                profile = obj.user.profile
                new_balance = profile.balance + obj.amount

                if new_balance < 0:
                    raise ValueError("Insufficient balance")

                profile.balance = new_balance
                profile.save(update_fields=["balance"])

                obj.balance_after = new_balance

        super().save_model(request, obj, form, change)
    list_display = (
        "id",
        "user",
        "transaction_type",
        "amount",
        "balance_after",
        "related_poll",
        "related_bet",
        "created_at",
    )

    list_filter = (
        "transaction_type",
        "created_at",
    )

    search_fields = (
        "user__username",
        "user__email",
        "description",
    )

    readonly_fields = (
        "balance_after",
        "created_at",
    )

    ordering = ("-created_at",)

    fieldsets = (
        ("User Info", {
            "fields": ("user",)
        }),
        ("Transaction Details", {
            "fields": (
                "transaction_type",
                "amount",
                "balance_after",
                "description",
            )
        }),
        ("Related Objects", {
            "fields": ("related_poll", "related_bet"),
        }),
        ("Timestamps", {
            "fields": ("created_at",),
        }),
    )
