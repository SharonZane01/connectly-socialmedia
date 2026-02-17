from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import generics
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.generics import RetrieveUpdateAPIView, RetrieveAPIView
from django.contrib.auth import get_user_model
from django.core.cache import cache
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import CustomTokenObtainPairSerializer, UserSerializer
from .email_service import send_otp_email
import random
import threading

User = get_user_model()


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')
        full_name = request.data.get('full_name')

        if not email or not password or not full_name:
            return Response({'error': 'All fields are required'}, status=400)

        if User.objects.filter(email=email).exists():
            return Response({'error': 'User already registered'}, status=400)

        otp = str(random.randint(100000, 999999))

        user_data = {
            'email': email,
            'password': password,
            'full_name': full_name,
            'profile_pic': None,
            'otp': otp
        }

        cache.set(f'signup_data_{email}', user_data, timeout=600)

        try:
            # Send email in background thread (non-blocking)
            threading.Thread(
                target=send_otp_email,
                args=(email, otp)
            ).start()

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
                return Response({'error': str(e)}, status=400)

        return Response({'error': 'Invalid OTP'}, status=400)


class FindPeopleView(generics.ListAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return User.objects.exclude(id=self.request.user.id)


class UserProfileView(RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class UserDetailView(RetrieveAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'id'
