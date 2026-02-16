from django.urls import path
from .views import RegisterView, UserProfileView, VerifyOTPView, CustomTokenObtainPairView, FindPeopleView, UserDetailView
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('verify-otp/', VerifyOTPView.as_view(), name='verify-otp'),
    path('login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('profile/', UserProfileView.as_view(), name='profile'),
    path('find-people/', FindPeopleView.as_view(), name='find-people'), # <--- New List
    path('profile/<int:id>/', UserDetailView.as_view(), name='user-detail'), # <--- NEW
]