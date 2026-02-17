from django.urls import path
from . import views

urlpatterns = [
    # Post URLs
    path('posts/', views.PostListCreateView.as_view(), name='post-list'),
    path('posts/<int:pk>/', views.PostDetailView.as_view(), name='post-detail'),

    # Comment URLs
    path('posts/<int:post_id>/comments/', views.CommentListCreateView.as_view(), name='post-comments'),

    # Action URLs
    path('posts/<int:pk>/like/', views.like_post, name='post-like'),
    path('posts/<int:pk>/save/', views.toggle_save, name='post-save'),
    
    # User Follow URL
    path('users/<int:user_id>/follow/', views.toggle_follow, name='user-follow'),
]