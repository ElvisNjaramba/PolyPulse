from django.contrib import admin
from .models import (
    PollCategory,
    Poll,
    PollOption,
    Bet,
    PollComment,
    CommentLike,
    Notification,
)

@admin.register(PollCategory)
class PollCategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "slug")
    search_fields = ("name",)
    prepopulated_fields = {"slug": ("name",)}

class PollOptionInline(admin.TabularInline):
    model = PollOption
    extra = 2

class BetInline(admin.TabularInline):
    model = Bet
    extra = 0
    readonly_fields = ("user", "option", "amount", "created_at")
    can_delete = False

@admin.register(Poll)
class PollAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "creator",
        "category",
        "status",
        "is_free",
        "min_bet",
        "closes_at",
        "created_at",
    )

    list_filter = (
        "status",
        "is_free",
        "category",
        "created_at",
    )

    search_fields = (
        "title",
        "description",
        "creator__username",
        "creator__email",
    )

    readonly_fields = ("created_at",)

    inlines = (
        PollOptionInline,
        BetInline,
    )

    ordering = ("-created_at",)

@admin.register(Bet)
class BetAdmin(admin.ModelAdmin):
    list_display = (
        "user",
        "poll",
        "option",
        "amount",
        "created_at",
    )

    list_filter = ("created_at",)
    search_fields = ("user__username", "poll__title")
    readonly_fields = ("created_at",)

@admin.register(PollComment)
class PollCommentAdmin(admin.ModelAdmin):
    list_display = (
        "user",
        "poll",
        "short_content",
        "parent",
        "is_hidden",
        "created_at",
    )

    list_filter = ("is_hidden", "created_at")
    search_fields = ("user__username", "content", "poll__title")
    readonly_fields = ("created_at",)

    def short_content(self, obj):
        return obj.content[:50]
    short_content.short_description = "Content"

@admin.register(CommentLike)
class CommentLikeAdmin(admin.ModelAdmin):
    list_display = ("comment", "user", "created_at")
    search_fields = ("comment__content", "user__username")
    readonly_fields = ("created_at",)

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = (
        "user",
        "actor",
        "notification_type",
        "is_read",
        "created_at",
    )

    list_filter = ("notification_type", "is_read", "created_at")
    search_fields = ("user__username", "message")
    readonly_fields = ("created_at",)
