from django.conf import settings
from django.db import models
from django.utils import timezone
import uuid

User = settings.AUTH_USER_MODEL


class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")

    phone_number = models.CharField(
    max_length=20,
    unique=True,
    null=True,
    blank=True
)


    balance = models.FloatField(default=1000)

    polls_created_today = models.IntegerField(default=0)
    last_poll_created_date = models.DateField(null=True, blank=True)
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)

    email_verified = models.BooleanField(default=False)
    email_verification_token = models.UUIDField(null=True, blank=True)

    current_streak = models.IntegerField(default=0)
    best_streak = models.IntegerField(default=0)
    total_predictions = models.IntegerField(default=0)
    correct_predictions = models.IntegerField(default=0)

    referral_code = models.CharField(max_length=20, blank=True, null=True)
    referred_by = models.ForeignKey(
        User, null=True, blank=True, on_delete=models.SET_NULL, related_name="referrals"
    )

    created_at = models.DateTimeField(auto_now_add=True)

    def reset_daily_polls_if_needed(self):
        today = timezone.now().date()
        if self.last_poll_created_date != today:
            self.polls_created_today = 0
            self.last_poll_created_date = today
            self.save()

    def can_create_poll(self):
        today = timezone.now().date()
        if self.last_poll_created_date != today:
            # New day — reset counter
            self.polls_created_today = 0
            self.last_poll_created_date = today
            self.save(update_fields=["polls_created_today", "last_poll_created_date"])
        return self.polls_created_today < 1

    def __str__(self):
        return f"{self.user.username} Profile"
    

class UserSession(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    session_id = models.UUIDField(default=uuid.uuid4, unique=True)
    device_fingerprint = models.CharField(max_length=255)
    ip_address = models.GenericIPAddressField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

class DeviceRegistration(models.Model):
    device_fingerprint = models.CharField(max_length=255)
    ip_address = models.GenericIPAddressField()
    user = models.ForeignKey(
        "auth.User",
        on_delete=models.CASCADE,
        related_name="device_registrations"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=["device_fingerprint"]),
            models.Index(fields=["ip_address"]),
        ]