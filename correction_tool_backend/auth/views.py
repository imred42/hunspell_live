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
