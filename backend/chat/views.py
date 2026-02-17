from rest_framework import generics, permissions
from rest_framework.pagination import LimitOffsetPagination
from django.db.models import Q
from .models import Message
from .serializers import MessageSerializer

# 1. Custom Pagination Class (Loads 50 messages at a time)
class ChatPagination(LimitOffsetPagination):
    default_limit = 50
    max_limit = 100

class ChatHistoryView(generics.ListAPIView):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = ChatPagination 

    def get_queryset(self):
        my_id = self.request.user.id
        other_user_id = self.kwargs['id']
        
        # 2. Optimized Query: Get conversation between User A and User B
        return Message.objects.filter(
            Q(sender_id=my_id, receiver_id=other_user_id) | 
            Q(sender_id=other_user_id, receiver_id=my_id)
        ).order_by('timestamp') # Oldest first (Standard for chat apps)