from rest_framework import generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from django.shortcuts import get_object_or_404
from .models import Post
from .serializers import PostSerializer


class PostListCreateView(generics.ListCreateAPIView):
    queryset = Post.objects.all().order_by('-created_at')
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        # Automatically set the author to the logged-in user
        serializer.save(author=self.request.user)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def like_post(request, pk):
    post = get_object_or_404(Post, pk=pk)
    user = request.user
    
    # TOGGLE LOGIC
    if post.liked_by.filter(id=user.id).exists():
        post.liked_by.remove(user) # Unlike
        liked = False
    else:
        post.liked_by.add(user)    # Like
        liked = True
        
    return Response({
        'likes': post.liked_by.count(), 
        'is_liked': liked
    })

class PostDetailView(generics.RetrieveDestroyAPIView):
    queryset = Post.objects.all()
    serializer_class = PostSerializer
    permission_classes = [IsAuthenticated]

    def perform_destroy(self, instance):
        # Security Check: Only allow delete if the user is the author
        if instance.author != self.request.user:
            raise PermissionDenied(detail="You can't delete someone else's post!")
        instance.delete()