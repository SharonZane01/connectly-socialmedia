from django.urls import path
from .views import CommentListCreateView, PostListCreateView, like_post, PostDetailView, toggle_follow # <--- Import PostDetailView

urlpatterns = [
    path('', PostListCreateView.as_view(), name='post-list-create'),
    path('<int:pk>/like/', like_post, name='like-post'),
    path('<int:pk>/', PostDetailView.as_view(), name='post-delete'), # <--- NEW
    path('<int:post_id>/comments/', CommentListCreateView.as_view(), name='post-comments'),
    path('follow/<int:user_id>/', toggle_follow, name='toggle-follow'), # <--- Follow Action
]