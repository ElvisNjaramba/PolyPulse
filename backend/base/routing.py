# base/routing.py
from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r"ws/market/(?P<poll_id>\d+)/$", consumers.MarketConsumer.as_asgi()),
]
