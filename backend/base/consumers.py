# backend/base/consumers.py
import json
from channels.generic.websocket import AsyncWebsocketConsumer

class MarketConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.poll_id = self.scope["url_route"]["kwargs"]["poll_id"]
        await self.channel_layer.group_add(
            f"poll_{self.poll_id}", self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            f"poll_{self.poll_id}", self.channel_name
        )

    # receive broadcast from group
    async def market_update(self, event):
        await self.send(text_data=json.dumps(event["data"]))

from channels.generic.websocket import AsyncWebsocketConsumer
import json
class PollConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.poll_id = self.scope["url_route"]["kwargs"]["poll_id"]
        self.group_name = f"poll_{self.poll_id}"

        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, text_data):
        pass  # optional

    async def send_poll_update(self, event):
        await self.send(text_data=json.dumps(event["data"]))