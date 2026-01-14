from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.exceptions import AuthenticationFailed
from authentication.models import UserSession

class SingleSessionJWTAuthentication(JWTAuthentication):
    def get_user(self, validated_token):
        user = super().get_user(validated_token)
        session_id = validated_token.get("session_id")

        if not UserSession.objects.filter(
            user=user,
            session_id=session_id,
            is_active=True
        ).exists():
            raise AuthenticationFailed("Session expired")

        return user

class VerifiedJWTAuthentication(JWTAuthentication):
    def get_user(self, validated_token):
        user = super().get_user(validated_token)

        if not user.profile.email_verified:
            raise AuthenticationFailed("Email verification required")

        return user