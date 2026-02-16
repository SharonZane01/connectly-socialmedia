from django.urls import path
from .views import ChatHistoryView

urlpatterns = [
    # API to get history: /api/chat/5/
    path('<int:id>/', ChatHistoryView.as_view(), name='chat-history'),
]