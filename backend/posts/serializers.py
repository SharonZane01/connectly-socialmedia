from rest_framework import serializers
from .models import Post

class PostSerializer(serializers.ModelSerializer):
    user = serializers.ReadOnlyField(source='author.full_name')
    image = serializers.URLField(source='image_url', required=True)
    
    # New computed fields
    likes = serializers.SerializerMethodField()
    is_liked = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = ['id', 'user', 'image', 'caption', 'created_at', 'likes', 'is_liked']
        read_only_fields = ['user', 'created_at', 'likes', 'is_liked']

    # 1. Count the total users in 'liked_by'
    def get_likes(self, obj):
        return obj.liked_by.count()

    # 2. Check if the logged-in user is in that list
    def get_is_liked(self, obj):
        user = self.context.get('request').user
        if user.is_authenticated:
            return obj.liked_by.filter(id=user.id).exists()
        return False