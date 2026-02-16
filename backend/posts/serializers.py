from rest_framework import serializers
from .models import Post, Comment

class CommentSerializer(serializers.ModelSerializer):
    author_name = serializers.ReadOnlyField(source="author.full_name")
    
    # Add this to allow creating a comment by passing just the post ID
    post_id = serializers.PrimaryKeyRelatedField(
        queryset=Post.objects.all(), source='post', write_only=True
    )

    class Meta:
        model = Comment
        fields = ["id", "post_id", "author_name", "content", "created_at"]
        read_only_fields = ["author_name", "created_at"]

class PostSerializer(serializers.ModelSerializer):
    author_name = serializers.ReadOnlyField(source="author.full_name")
    
    # SerializerMethodFields
    likes = serializers.SerializerMethodField()
    is_liked = serializers.SerializerMethodField()
    is_saved = serializers.SerializerMethodField() # Added this since you have a save feature

    class Meta:
        model = Post
        fields = [
            "id", "author", "author_name", "caption", 
            "media_url", "media_type", "created_at", 
            "likes", "is_liked", "is_saved"
        ]
        read_only_fields = ["author", "likes", "is_liked", "is_saved"]

    def get_likes(self, obj):
        return obj.liked_by.count()

    def get_is_liked(self, obj):
        user = self.context.get("request").user
        if user and user.is_authenticated:
            return obj.liked_by.filter(id=user.id).exists()
        return False

    def get_is_saved(self, obj):
        user = self.context.get("request").user
        if user and user.is_authenticated:
            return obj.saved_by.filter(id=user.id).exists()
        return False