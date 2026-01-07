from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from .serializers import RegisterSerializer, ProfileSerializer
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated

class AuthViewSet(viewsets.ViewSet):
    permission_classes = [permissions.AllowAny]

    def create(self, request):
        serializer = RegisterSerializer(data=request.data)

        if not serializer.is_valid():
            print(serializer.errors)   # 👈 ADD THIS
            return Response(serializer.errors, status=400)

        serializer.save()
        return Response(
            {"message": "Account created successfully"},
            status=201,
        )

class ProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        profile = request.user.profile
        serializer = ProfileSerializer(profile)
        return Response(serializer.data)