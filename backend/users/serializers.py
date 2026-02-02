from rest_framework import serializers
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})

    class Meta:
        model = User
        fields = ['id', 'email', 'full_name', 'password', 'profile_pic', 'bio']

    def create(self, validated_data):
        # We use .get(..., None) for profile_pic to avoid sending "" to a URLField
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            full_name=validated_data.get('full_name', ''),
            profile_pic=validated_data.get('profile_pic', None), 
            bio=validated_data.get('bio', '')
        )
        return user

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        # 1. Generate the standard token
        data = super().validate(attrs)
        
        # 2. Add extra user data to the response (Optional but useful)
        data['full_name'] = self.user.full_name
        data['email'] = self.user.email
        
        # REMOVED: "if not self.user.is_verified" 
        # The crash happened here because the field was removed from the DB.
        
        return data