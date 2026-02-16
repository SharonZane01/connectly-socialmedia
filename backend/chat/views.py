from rest_framework import generics, permissions
from .models import Message
from .serializers import MessageSerializer
from django.db.models import Q

from rest_framework.pagination import LimitOffsetPagination # <--- Import this

from .serializers import MessageSerializer
from django.db.models import Q

class ChatPagination(LimitOffsetPagination):
    default_limit = 50
    max_limit = 100

class ChatHistoryView(generics.ListAPIView):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = ChatPagination # <--- Add this line

    def get_queryset(self):
        my_id = self.request.user.id
        other_user_id = self.kwargs['id']
        
        return Message.objects.filter(
            Q(sender_id=my_id, receiver_id=other_user_id) | 
            Q(sender_id=other_user_id, receiver_id=my_id)
        ).order_by('-timestamp')

class ChatHistoryView(generics.ListAPIView):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        my_id = self.request.user.id
        other_user_id = self.kwargs['id']
        
        # Get messages sent by ME to HIM -OR- by HIM to ME
        return Message.objects.filter(
            Q(sender_id=my_id, receiver_id=other_user_id) | 
            Q(sender_id=other_user_id, receiver_id=my_id)
        ).order_by('timestamp')