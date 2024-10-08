from rest_framework import serializers
from django.contrib.auth.models import User

class RegisterSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['username', 'password', 'email']  # Add any other fields you need

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user
