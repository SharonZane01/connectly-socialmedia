from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model

from .models import Post, Comment, Follow
from .serializers import PostSerializer, CommentSerializer

User = get_user_model()

# --- POSTS ---

class PostListCreateView(generics.ListCreateAPIView):
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        queryset = Post.objects.all().order_by('-created_at')
        feed_type = self.request.query_params.get('feed')

        if feed_type == 'following' and self.request.user.is_authenticated:
            following_users = self.request.user.following.values_list('following', flat=True)
            queryset = queryset.filter(author__id__in=following_users)

        return queryset

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

class PostDetailView(generics.RetrieveDestroyAPIView):
    queryset = Post.objects.all()
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def perform_destroy(self, instance):
        if instance.author != self.request.user:
            raise PermissionDenied("You can't delete someone else's post!")
        instance.delete()

# --- COMMENTS ---

class CommentListCreateView(generics.ListCreateAPIView):
    serializer_class = CommentSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        post_id = self.kwargs.get('post_id')
        return Comment.objects.filter(post_id=post_id).order_by('-created_at')

    def perform_create(self, serializer):
        post_id = self.kwargs.get('post_id')
        post = get_object_or_404(Post, pk=post_id)
        # Fix: We manually inject author and post. 
        # The serializer accepts this because we set read_only=True in serializers.py
        serializer.save(author=self.request.user, post=post)

# --- ACTIONS (Like, Save, Follow) ---

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def like_post(request, pk):
    post = get_object_or_404(Post, pk=pk)
    user = request.user
    
    if post.liked_by.filter(id=user.id).exists():
        post.liked_by.remove(user)
        liked = False
    else:
        post.liked_by.add(user)
        liked = True
        
    return Response({
        'likes': post.liked_by.count(), 
        'is_liked': liked
    })

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def toggle_save(request, pk):
    post = get_object_or_404(Post, pk=pk)
    user = request.user

    if post.saved_by.filter(id=user.id).exists():
        post.saved_by.remove(user)
        saved = False
    else:
        post.saved_by.add(user)
        saved = True

    return Response({"saved": saved, "is_saved": saved})

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def toggle_follow(request, user_id):
    if request.user.id == user_id:
        return Response({"error": "You cannot follow yourself."}, status=400)

    target_user = get_object_or_404(User, id=user_id)
    currentUser = request.user

    try:
        follow_instance = Follow.objects.get(follower=currentUser, following=target_user)
        follow_instance.delete()
        is_following = False
    except Follow.DoesNotExist:
        Follow.objects.create(follower=currentUser, following=target_user)
        is_following = True

    return Response({"following": is_following})