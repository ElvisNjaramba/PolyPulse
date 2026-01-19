from rest_framework import viewsets, permissions, status
from rest_framework.response import Response

from authentication.permissions import IsActiveSession
from .serializers import EmailVerifiedTokenSerializer, RegisterSerializer, ProfileSerializer
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken

from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.exceptions import AuthenticationFailed
from authentication.models import DeviceRegistration, Profile, UserSession
from authentication.tokens import get_tokens_for_user

from authentication.auth import (
    SingleSessionJWTAuthentication,
    VerifiedJWTAuthentication,
)

class AuthViewSet(viewsets.ViewSet):
    permission_classes = [permissions.AllowAny]

    def create(self, request):
        serializer = RegisterSerializer(
            data=request.data,
            context={"request": request}  # ✅ pass request
        )

        if not serializer.is_valid():
            print(serializer.errors)
            return Response(serializer.errors, status=400)

        serializer.save()
        return Response(
            {"message": "Account created successfully"},
            status=201,
        )

class ProfileView(APIView):   
    authentication_classes = [
        SingleSessionJWTAuthentication,
        VerifiedJWTAuthentication,
    ]
    permission_classes = [IsAuthenticated]
    def get(self, request):
        profile = request.user.profile
        serializer = ProfileSerializer(profile)
        return Response(serializer.data)
    
class VerifyEmailView(APIView):
    permission_classes = []

    def get(self, request, token):
        profile = Profile.objects.filter(
            email_verification_token=token
        ).first()

        if not profile:
            return Response(
                {"detail": "Invalid or expired token"},
                status=400
            )

        profile.email_verified = True
        profile.email_verification_token = None
        profile.save()

        return Response({"message": "Email verified successfully"})

from rest_framework.permissions import AllowAny
class LoginView(TokenObtainPairView): 
    permission_classes = [AllowAny]
    authentication_classes = []
    serializer_class = EmailVerifiedTokenSerializer

# from rest_framework_simplejwt.views import TokenRefreshView
# class PublicTokenRefreshView(TokenRefreshView):
#     permission_classes = [AllowAny]
#     authentication_classes = []
#     serializer_class = SessionAwareTokenRefreshSerializer