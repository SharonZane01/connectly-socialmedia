import json
import traceback # Import this to print errors
from urllib.parse import parse_qs
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import AccessToken
from .models import Message

User = get_user_model()

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        try:
            print("--- Attempting WebSocket Connection ---")
            
            # 1. Try to get User from Session
            self.my_id = self.scope["user"].id
            print(f"Session User ID: {self.my_id}")

            # 2. If no Session, try Token
            if not self.my_id:
                query_string = self.scope['query_string'].decode()
                params = parse_qs(query_string)
                token = params.get('token', [None])[0]
                
                if token:
                    print("Token found, decoding...")
                    access_token = AccessToken(token)
                    
                    # === THE FIX: Wrap this in int() ===
                    self.my_id = int(access_token['user_id']) 
                    
                    # Fetch user securely
                    self.scope["user"] = await self.get_user(self.my_id)
                    print(f"Token User ID: {self.my_id}")
            
            # 3. If still no user, reject
            if not self.my_id:
                print("No user found. Closing connection.")
                await self.close()
                return

            # 4. Join Room
            self.other_user_id = int(self.scope["url_route"]["kwargs"]["id"])
            
            if self.my_id > self.other_user_id:
                self.room_name = f"chat_{self.other_user_id}_{self.my_id}"
            else:
                self.room_name = f"chat_{self.my_id}_{self.other_user_id}"

            self.room_group_name = f"chat_{self.room_name}"

            await self.channel_layer.group_add(
                self.room_group_name,
                self.channel_name
            )

            await self.accept()
            print("--- Connection Successful ---")

        except Exception as e:
            # THIS WILL PRINT THE REAL ERROR IN YOUR TERMINAL
            print("!!!!! WEBSOCKET ERROR !!!!!")
            traceback.print_exc()
            await self.close()

    async def disconnect(self, close_code):
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )

    async def receive(self, text_data):
        try:
            print("RAW DATA:", text_data)
            data = json.loads(text_data)
            message = data.get('message')
            if not message:
                print("No message provided")
                return
            await self.save_message(message)
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'chat_message',
                    'message': message,
                    'sender_id': self.my_id,
                    'sender_email': self.scope["user"].email
                }
            )

        except Exception as e:
            print("Error:", e)


    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            'message': event['message'],
            'sender_id': event['sender_id'],
            'sender_email': event['sender_email']
        }))

    @database_sync_to_async
    def get_user(self, user_id):
        try:
            return User.objects.get(id=user_id)
        except User.DoesNotExist:
            return None
    
    @database_sync_to_async
    def save_message(self, message):
        other_user = User.objects.get(id=self.other_user_id)
        Message.objects.create(
            sender=self.scope["user"],
            receiver=other_user,
            content=message
        )