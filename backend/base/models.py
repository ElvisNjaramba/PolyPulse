from django.db import models
from django.conf import settings
from django.utils import timezone


class PollCategory(models.Model):
    name = models.CharField(max_length=50, unique=True)
    slug = models.SlugField(unique=True)

    def __str__(self):
        return self.name
    
User = settings.AUTH_USER_MODEL

class Poll(models.Model):
    STATUS_CHOICES = (
        ("open", "Open"),
        ("closed", "Closed"),
        ("resolved", "Resolved"),
        ("suspended", "Suspended"),
    )

    creator = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="polls"
    )

    category = models.ForeignKey(
        "PollCategory",
        on_delete=models.SET_NULL,
        null=True,
        related_name="polls"
    )

    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)

    is_free = models.BooleanField(default=False)
    min_bet = models.IntegerField(default=10)

    closes_at = models.DateTimeField()
    status = models.CharField(
        max_length=10,
        choices=STATUS_CHOICES,
        default="open"
    )

    winning_option = models.ForeignKey(
        "PollOption",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="won_polls"
    )

    created_at = models.DateTimeField(auto_now_add=True)

    # ✅ Correct close logic
    def close_if_expired(self):
        if self.status == "open" and timezone.now() >= self.closes_at:
            self.status = "closed"
            self.save(update_fields=["status"])

    def can_accept_bets(self):
        return self.status == "open" and timezone.now() < self.closes_at

    def __str__(self):
        return self.title

class PollOption(models.Model):
    poll = models.ForeignKey(
        Poll,
        on_delete=models.CASCADE,
        related_name="options"
    )

    text = models.CharField(max_length=255)

    def __str__(self):
        return f"{self.poll.title} - {self.text}"

class Bet(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="bets"
    )

    poll = models.ForeignKey(
        Poll,
        on_delete=models.CASCADE,
        related_name="bets"
    )

    option = models.ForeignKey(
        PollOption,
        on_delete=models.CASCADE,
        related_name="bets"
    )

    amount = models.PositiveIntegerField()

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "poll")  # one bet per poll (v1)

    def __str__(self):
        return f"{self.user} bet {self.amount} on {self.option}"

class PollComment(models.Model):
    poll = models.ForeignKey(
        Poll,
        on_delete=models.CASCADE,
        related_name="comments"
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE
    )

    parent = models.ForeignKey(
        "self",
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name="replies"
    )
    is_hidden = models.BooleanField(default=False)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return f"{self.user.username}: {self.content[:30]}"

class CommentLike(models.Model):
    comment = models.ForeignKey(
        PollComment,
        on_delete=models.CASCADE,
        related_name="likes"
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("comment", "user")


class Notification(models.Model):
    NOTIFICATION_TYPES = (
        ("mention", "Mention"),
        ("bet_won", "Bet Won"),
        ("bet_refunded", "Bet Refunded"),
        ("poll_resolved", "Poll Resolved"),
    )

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="notifications"
    )

    actor = models.ForeignKey(
        User,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="actions"
    )

    notification_type = models.CharField(
        max_length=30,
        choices=NOTIFICATION_TYPES
    )

    message = models.CharField(max_length=255)
    is_read = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user} - {self.notification_type}"
