# backend/base/signals.py
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import MarketPriceSnapshot
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

@receiver(post_save, sender=MarketPriceSnapshot)
def broadcast_market_snapshot(sender, instance, created, **kwargs):
    if not created:
        return

    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        f"poll_{instance.market.poll.id}",
        {
            "type": "market_update",
            "data": {
                "created_at": instance.created_at.isoformat(),
                "yes_price": instance.yes_price,
                "no_price": instance.no_price,
            },
        },
    )
