from rest_framework import serializers
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from posts.models import Follow

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    # 1. Password field (Write Only)
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})
    
    # 2. Add this missing line for the 'get_is_following' method to work
    is_following = serializers.SerializerMethodField()
    followers_count = serializers.IntegerField(source='followers.count', read_only=True)
    following_count = serializers.IntegerField(source='following.count', read_only=True)

    class Meta:
        model = User
        # 3. Added 'password' to this list
        fields = [
            'id', 
            'email', 
            'full_name', 
            'password', 
            'profile_pic', 
            'bio', 
            'is_following', 
            'followers_count', # <--- Make sure this is here
            'following_count'  # <--- Make sure this is here
        ]
        read_only_fields = ['email', 'is_following', 'followers_count', 'following_count']

    def create(self, validated_data):
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            full_name=validated_data.get('full_name', ''),
            profile_pic=validated_data.get('profile_pic', None), 
            bio=validated_data.get('bio', '')
        )
        return user
    
    def get_is_following(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return Follow.objects.filter(follower=request.user, following=obj).exists()
        return False

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        data['full_name'] = self.user.full_name
        data['email'] = self.user.email
        return data