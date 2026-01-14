from django.contrib.auth.models import User
from rest_framework.exceptions import ValidationError, AuthenticationFailed
from rest_framework import serializers
from authentication.models import DeviceRegistration, Profile, UserSession

import uuid
from django.core.mail import send_mail
from django.conf import settings

from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from authentication.tokens import get_tokens_for_user

MAX_ACCOUNTS_PER_DEVICE = 2
MAX_ACCOUNTS_PER_IP = 3

class RegisterSerializer(serializers.Serializer):
    username = serializers.CharField()
    email = serializers.EmailField()
    phone_number = serializers.CharField()
    password = serializers.CharField(write_only=True)
    password_confirm = serializers.CharField(write_only=True)

    def validate(self, data):
        if data["password"] != data["password_confirm"]:
            raise serializers.ValidationError("Passwords do not match")
        return data

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Username already exists")
        return value

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email already exists")
        return value

    def validate_phone_number(self, value):
        if Profile.objects.filter(phone_number=value).exists():
            raise serializers.ValidationError("Phone number already exists")
        return value

    def create(self, validated_data):
        request = self.context["request"]
        device_fp = request.headers.get("X-Device-Fingerprint")
        ip = request.META.get("REMOTE_ADDR")

        if not device_fp:
            raise ValidationError("Device fingerprint missing")

        # 🚫 DEVICE LIMIT
        if DeviceRegistration.objects.filter(
            device_fingerprint=device_fp
        ).count() >= MAX_ACCOUNTS_PER_DEVICE:
            raise ValidationError(
                "Too many accounts created from this device"
            )

        # 🚫 IP LIMIT (per 24h)
        from django.utils import timezone
        from datetime import timedelta

        last_24h = timezone.now() - timedelta(hours=24)
        if DeviceRegistration.objects.filter(
            ip_address=ip,
            created_at__gte=last_24h
        ).count() >= MAX_ACCOUNTS_PER_IP:
            raise ValidationError(
                "Too many registrations from this IP"
            )
        
        validated_data.pop("password_confirm")
        phone_number = validated_data.pop("phone_number")

        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data["email"],
            password=validated_data["password"],
        )

        profile = user.profile
        profile.phone_number = phone_number
        profile.email_verification_token = uuid.uuid4()
        profile.email_verified = False
        profile.save()

        verify_link = f"http://localhost:5173/verify-email/{profile.email_verification_token}"

        send_mail(
            subject="Verify your email",
            message=f"Click the link to verify your account:\n{verify_link}",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=False,
        )

        DeviceRegistration.objects.create(
            user=user,
            device_fingerprint=device_fp,
            ip_address=ip,
        )
        return user

class ProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username")
    email = serializers.EmailField(source="user.email")
    is_admin = serializers.SerializerMethodField()
    polls_remaining_today = serializers.SerializerMethodField()

    class Meta:
        model = Profile
        fields = (
            "username",
            "email",
            "phone_number",
            "balance",
            "polls_remaining_today",
            "is_admin",
        )

    def get_is_admin(self, obj):
        return obj.user.is_staff or obj.user.is_superuser

    def get_polls_remaining_today(self, obj):
        limit = 2
        return max(0, limit - obj.polls_created_today)
    
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework.exceptions import AuthenticationFailed

class EmailVerifiedTokenSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        # Standard JWT authentication
        data = super().validate(attrs)

        user = self.user  # ✅ safe here

        # Block login if email not verified
        if not user.profile.email_verified:
            raise AuthenticationFailed("Verify your email first")

        # Kill previous sessions (single session enforcement)
        UserSession.objects.filter(user=user).update(is_active=False)

        # Track device + IP
        request = self.context.get("request")
        device_fp = request.headers.get("X-Device-Fingerprint", "unknown") if request else "unknown"
        ip = request.META.get("REMOTE_ADDR") if request else "0.0.0.0"

        UserSession.objects.create(
            user=user,
            device_fingerprint=device_fp,
            ip_address=ip,
        )

        # Return tokens
        tokens = get_tokens_for_user(user)
        return tokens