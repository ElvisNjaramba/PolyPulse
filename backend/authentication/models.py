from django.conf import settings
from django.db import models
from django.utils import timezone

User = settings.AUTH_USER_MODEL


class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")

    phone_number = models.CharField(
    max_length=20,
    unique=True,
    null=True,
    blank=True
)


    balance = models.IntegerField(default=1000)

    polls_created_today = models.IntegerField(default=0)
    last_poll_created_date = models.DateField(null=True, blank=True)

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
        if self.user.is_staff or self.user.is_superuser:
            return True
        self.reset_daily_polls_if_needed()
        return self.polls_created_today < 2

    def __str__(self):
        return f"{self.user.username} Profile"
