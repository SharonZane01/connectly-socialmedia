# backend/chat/routing.py
from django.urls import re_path # Use re_path for better stability with websockets
from . import consumers

websocket_urlpatterns = [
    # Note: re_path uses Regex. (?P<id>\w+) captures the ID.
    re_path(r'ws/chat/(?P<id>\w+)/$', consumers.ChatConsumer.as_asgi()),
]