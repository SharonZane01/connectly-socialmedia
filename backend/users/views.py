from rest_framework.views import APIView
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.core.mail import send_mail
from django.conf import settings
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import CustomTokenObtainPairSerializer
import random
from rest_framework.generics import RetrieveUpdateAPIView
from rest_framework.permissions import IsAuthenticated
from .serializers import UserSerializer
from rest_framework.permissions import AllowAny
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from .serializers import UserSerializer
from django.contrib.auth import get_user_model
from rest_framework.generics import RetrieveAPIView

User = get_user_model()

class RegisterView(APIView):
    permission_classes = [AllowAny] 
    def post(self, request):
        data = request.data
        email = data.get('email')
        password = data.get('password')
        full_name = data.get('full_name')
        

        if not email or not password or not full_name:
            return Response({'error': 'All fields are required'}, status=400)

        if User.objects.filter(email=email).exists():
            return Response({'error': 'User already registered'}, status=400)

        otp = str(random.randint(100000, 999999))
        
        # Store in Cache (Force profile_pic to None)
        user_data = {
            'email': email,
            'password': password,
            'full_name': full_name,
            'profile_pic': None,  # <--- FORCE NONE
            'otp': otp
        }
        cache.set(f'signup_data_{email}', user_data, timeout=600)

        try:
            send_mail(
                'Your Connectly Verification Code',
                f'Your OTP is: {otp}. It is valid for 10 minutes.',
                settings.DEFAULT_FROM_EMAIL,
                [email],
                fail_silently=False,
            )
            return Response({'message': 'OTP sent to email'}, status=200)
        except Exception as e:
            cache.delete(f'signup_data_{email}')
            return Response({'error': f'Email failed: {str(e)}'}, status=500)


class VerifyOTPView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        email = request.data.get('email')
        otp_input = request.data.get('otp')

        cached_data = cache.get(f'signup_data_{email}')

        if not cached_data:
            return Response({'error': 'OTP expired or invalid email'}, status=400)

        if str(cached_data['otp']) == str(otp_input):
            try:
                # Create user (profile_pic is guaranteed to be None now)
                User.objects.create_user(
                    email=cached_data['email'],
                    password=cached_data['password'],
                    full_name=cached_data['full_name'],
                    profile_pic=cached_data['profile_pic'], 
                    is_active=True 
                )
                
                cache.delete(f'signup_data_{email}')
                return Response({'message': 'Account verified successfully!'}, status=200)
            except Exception as e:
                print(f" !!! CRASH: {e}") # Keep this just in case
                return Response({'error': str(e)}, status=400)
        else:
            return Response({'error': 'Invalid OTP'}, status=400)
        

class FindPeopleView(generics.ListAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Return all users EXCEPT the one logged in
        return User.objects.exclude(id=self.request.user.id)
        
class UserProfileView(RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        # Returns the currently logged-in user
        return self.request.user

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

class UserDetailView(RetrieveAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'id'