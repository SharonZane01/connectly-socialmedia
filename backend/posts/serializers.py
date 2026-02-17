from rest_framework import serializers
from .models import Post, Comment
from django.contrib.auth import get_user_model

User = get_user_model()

class CommentSerializer(serializers.ModelSerializer):
    author_name = serializers.ReadOnlyField(source='author.full_name')
    author_pic = serializers.ReadOnlyField(source='author.profile_pic.url') # Useful for frontend

    # FIX: Set read_only=True so validation doesn't fail
    post = serializers.PrimaryKeyRelatedField(read_only=True)
    author = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Comment
        fields = ['id', 'post', 'author', 'author_name', 'author_pic', 'content', 'created_at']

class PostSerializer(serializers.ModelSerializer):
    author_name = serializers.ReadOnlyField(source='author.full_name')
    # Add count fields so frontend knows numbers immediately
    likes_count = serializers.SerializerMethodField()
    comment_count = serializers.SerializerMethodField()
    # Add boolean checks for current user
    is_liked = serializers.SerializerMethodField()
    is_saved = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = [
            'id', 'author', 'author_name', 'caption', 
            'media_url', 'media_type', 'created_at', 
            'likes_count', 'comment_count', 'is_liked', 'is_saved'
        ]
        read_only_fields = ['author', 'likes_count', 'comment_count', 'is_liked', 'is_saved']

    def get_likes_count(self, obj):
        return obj.liked_by.count()

    def get_comment_count(self, obj):
        return obj.comments.count()

    def get_is_liked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.liked_by.filter(id=request.user.id).exists()
        return False

    def get_is_saved(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.saved_by.filter(id=request.user.id).exists()
        return False