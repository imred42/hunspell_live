from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from rest_framework import generics
from django.contrib.auth.models import User
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import api_view
from django.contrib.auth.hashers import make_password
from django.http import HttpResponse
from .serializers import RegisterSerializer  # Ensure you have a serializer for registration
from django.shortcuts import redirect
from django.contrib.auth.decorators import login_required
from django.contrib.auth import logout
from allauth.socialaccount.models import SocialAccount
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated

class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer  # Add this line
    queryset = User.objects.all()
    permission_classes = (AllowAny,)
    
    def post(self, request, *args, **kwargs):
        username = request.data.get('username')
        password = request.data.get('password')
        if not username or not password:
            return Response({"error": "Username and password are required"}, status=status.HTTP_400_BAD_REQUEST)
        
        user = User.objects.create(username=username, password=make_password(password))
        return Response({"message": "User created successfully"}, status=status.HTTP_201_CREATED)

# Add a new class for login using TokenObtainPairView
class LoginView(TokenObtainPairView):
    permission_classes = (AllowAny,)

# TokenObtainPairView and TokenRefreshView are provided by Simple JWT

def home(request):
    return HttpResponse("Welcome to the Home Page")

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_info(request):
    user = request.user
    try:
        google_account = SocialAccount.objects.get(user=user, provider='google')
        extra_data = google_account.extra_data
        return Response({
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'google_id': extra_data.get('sub'),
            'picture': extra_data.get('picture'),
        })
    except SocialAccount.DoesNotExist:
        return Response({
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
        })

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    logout(request)
    return Response({"message": "Successfully logged out."}, status=status.HTTP_200_OK)

def google_login(request):
    return redirect('accounts/google/login/')
