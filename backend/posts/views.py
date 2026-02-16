from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied, NotFound
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model # Import User model

from .models import Post, Comment, Follow
from .serializers import PostSerializer, CommentSerializer

User = get_user_model() # Define User

class PostListCreateView(generics.ListCreateAPIView):
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        # 1. Start with all posts sorted by newest
        queryset = Post.objects.all().order_by('-created_at')

        # 2. Check if the frontend asked for the "following" feed
        feed_type = self.request.query_params.get('feed')

        if feed_type == 'following' and self.request.user.is_authenticated:
            # Get the list of IDs of people I follow
            # 'following' is the related_name we set in the Follow model
            following_users = self.request.user.following.values_list('following', flat=True)
            
            # Filter: Show posts ONLY if the author is in that list
            queryset = queryset.filter(author__id__in=following_users)

        return queryset

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

class PostDetailView(generics.RetrieveDestroyAPIView):
    queryset = Post.objects.all()
    serializer_class = PostSerializer
    permission_classes = [IsAuthenticated]

    def perform_destroy(self, instance):
        if instance.author != self.request.user:
            raise PermissionDenied("You can't delete someone else's post!")
        instance.delete()

# IMPROVED: Generic Create View for Comments
class CommentListCreateView(generics.ListCreateAPIView):
    serializer_class = CommentSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        # Filter comments by the post ID in the URL
        post_id = self.kwargs.get('post_id')
        return Comment.objects.filter(post_id=post_id).order_by('-created_at')

    def perform_create(self, serializer):
        post_id = self.kwargs.get('post_id')
        post = get_object_or_404(Post, pk=post_id)
        serializer.save(author=self.request.user, post=post)

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

    return Response({"saved": saved})

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def toggle_follow(request, user_id):
    # Prevent user from following themselves
    if request.user.id == user_id:
        return Response({"error": "You cannot follow yourself."}, status=400)

    target_user = get_object_or_404(User, id=user_id)
    currentUser = request.user

    # Toggle logic
    try:
        follow_instance = Follow.objects.get(follower=currentUser, following=target_user)
        follow_instance.delete()
        is_following = False
    except Follow.DoesNotExist:
        Follow.objects.create(follower=currentUser, following=target_user)
        is_following = True

    return Response({"following": is_following})