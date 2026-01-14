from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from .serializers import EmailVerifiedTokenSerializer, RegisterSerializer, ProfileSerializer
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken

from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.exceptions import AuthenticationFailed
from authentication.models import DeviceRegistration, Profile, UserSession
from authentication.tokens import get_tokens_for_user

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
    permission_classes = [IsAuthenticated]

    def get(self, request):
        profile = request.user.profile
        serializer = ProfileSerializer(profile)
        return Response(serializer.data)

# class CustomTokenObtainPairView(TokenObtainPairView):
#     def post(self, request, *args, **kwargs):
#         response = super().post(request, *args, **kwargs)

#         user = self.user  # set by serializer

#         if not user.profile.email_verified:
#             raise AuthenticationFailed("Verify your email first")

#         # 🔥 Kill all previous sessions
#         UserSession.objects.filter(user=user).update(is_active=False)

#         device_fp = request.headers.get("X-Device-Fingerprint", "unknown")
#         ip = request.META.get("REMOTE_ADDR")

#         session = UserSession.objects.create(
#             user=user,
#             device_fingerprint=device_fp,
#             ip_address=ip,
#         )

#         tokens = get_tokens_for_user(user, session)

#         return Response(tokens)
    
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


class LoginView(TokenObtainPairView):
    serializer_class = EmailVerifiedTokenSerializer