import json
from urllib.parse import parse_qs
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import AccessToken
from .models import Message

User = get_user_model()

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # 1. Get Token from URL Query Params
        query_string = self.scope['query_string'].decode()
        params = parse_qs(query_string)
        token = params.get('token', [None])[0]

        # 2. Authenticate User
        self.my_id = None
        if token:
            try:
                access_token = AccessToken(token)
                self.my_id = int(access_token['user_id'])
                self.scope["user"] = await self.get_user(self.my_id)
            except Exception as e:
                print(f"WebSocket Auth Error: {e}")

        # 3. Reject if authentication failed
        if not self.my_id or not self.scope["user"]:
            print("Connection rejected: No authenticated user.")
            await self.close()
            return

        # 4. Create Room Name (Sort IDs to ensure unique room: chat_1_2 is same as chat_2_1)
        self.other_user_id = int(self.scope["url_route"]["kwargs"]["id"])
        ids = sorted([self.my_id, self.other_user_id])
        self.room_group_name = f"chat_{ids[0]}_{ids[1]}"

        # 5. Join Group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()
        print(f"WebSocket Connected: User {self.my_id} to Room {self.room_group_name}")

    async def disconnect(self, close_code):
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            msg_type = data.get('type')

            # CASE A: Standard Chat Message
            if msg_type == 'message':
                message_content = data.get('message')
                if message_content:
                    # 1. Save to Database
                    await self.save_message(message_content)
                    
                    # 2. Broadcast to Room
                    await self.channel_layer.group_send(
                        self.room_group_name,
                        {
                            'type': 'chat_message',
                            'message': message_content,
                            'sender_id': self.my_id
                        }
                    )

            # CASE B: Typing Indicator
            elif msg_type == 'typing':
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'user_typing',
                        'user_id': self.my_id
                    }
                )

        except Exception as e:
            print(f"Error in receive: {e}")

    # --- Group Handlers (Send data back to client) ---

    async def chat_message(self, event):
        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'message',
            'message': event['message'],
            'sender_id': event['sender_id']
        }))

    async def user_typing(self, event):
        # Send typing status to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'typing',
            'user_id': event['user_id']
        }))

    # --- Database Helpers ---

    @database_sync_to_async
    def get_user(self, user_id):
        try:
            return User.objects.get(id=user_id)
        except User.DoesNotExist:
            return None

    @database_sync_to_async
    def save_message(self, message):
        try:
            other_user = User.objects.get(id=self.other_user_id)
            Message.objects.create(
                sender=self.scope["user"],
                receiver=other_user,
                content=message
            )
        except Exception as e:
            print(f"Database Save Error: {e}")