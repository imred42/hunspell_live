from django.urls import path
from .views import RegisterView, LoginView, home
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('', home, name='home'),  # Root URL
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/login/', LoginView.as_view(), name='login'),  # This is your token obtain endpoint
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),  # Refresh token endpoint
]
