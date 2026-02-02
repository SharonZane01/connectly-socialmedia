from django.urls import path
from .views import PostListCreateView, like_post, PostDetailView # <--- Import PostDetailView

urlpatterns = [
    path('', PostListCreateView.as_view(), name='post-list-create'),
    path('<int:pk>/like/', like_post, name='like-post'),
    path('<int:pk>/', PostDetailView.as_view(), name='post-delete'), # <--- NEW
]