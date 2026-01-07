from django.contrib.auth.models import User
from rest_framework import serializers
from authentication.models import Profile


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
        validated_data.pop("password_confirm")
        phone_number = validated_data.pop("phone_number")

        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data["email"],
            password=validated_data["password"],
        )

        # Profile already exists via signal — just update it
        user.profile.phone_number = phone_number
        user.profile.save()

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
