from django.contrib import admin
from .models import (
    PollCategory, Poll, PollOption, Bet, PollComment, CommentLike,
    Notification, Market, MarketPosition, MarketPriceSnapshot, Challenge
)


# ─────────────────────────────
# Inline Models
# ─────────────────────────────

class PollOptionInline(admin.TabularInline):
    model = PollOption
    extra = 2


class BetInline(admin.TabularInline):
    model = Bet
    extra = 0
    readonly_fields = ("user", "option", "amount", "shares", "created_at")


class CommentInline(admin.TabularInline):
    model = PollComment
    extra = 0
    readonly_fields = ("user", "content", "created_at")


# ─────────────────────────────
# Core Models
# ─────────────────────────────

@admin.register(PollCategory)
class PollCategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "slug")
    search_fields = ("name",)
    prepopulated_fields = {"slug": ("name",)}


@admin.register(Poll)
class PollAdmin(admin.ModelAdmin):
    list_display = (
        "title", "creator", "status", "category",
        "is_free", "min_bet", "closes_at", "created_at"
    )
    list_filter = ("status", "is_free", "category", "created_at")
    search_fields = ("title", "description")
    autocomplete_fields = ("creator", "category", "winning_option")

    readonly_fields = ("created_at",)

    fieldsets = (
        ("Basic Info", {
            "fields": ("creator", "title", "description", "category")
        }),
        ("Market Settings", {
            "fields": ("is_free", "min_bet", "winning_option")
        }),
        ("Resolution", {
            "fields": ("resolution_criteria",)
        }),
        ("Timing & Status", {
            "fields": ("closes_at", "status", "created_at")
        }),
    )

    inlines = [PollOptionInline, BetInline, CommentInline]


@admin.register(PollOption)
class PollOptionAdmin(admin.ModelAdmin):
    list_display = ("text", "poll", "order")
    list_filter = ("poll",)
    search_fields = ("text",)


@admin.register(Bet)
class BetAdmin(admin.ModelAdmin):
    list_display = ("user", "poll", "option", "amount", "shares", "created_at")
    list_filter = ("poll", "option", "created_at")
    search_fields = ("user__username",)
    autocomplete_fields = ("user", "poll", "option")


@admin.register(PollComment)
class PollCommentAdmin(admin.ModelAdmin):
    list_display = ("user", "poll", "short_content", "is_hidden", "created_at")
    list_filter = ("is_hidden", "created_at")
    search_fields = ("content", "user__username")

    def short_content(self, obj):
        return obj.content[:50]


@admin.register(CommentLike)
class CommentLikeAdmin(admin.ModelAdmin):
    list_display = ("user", "comment", "created_at")
    search_fields = ("user__username",)


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ("user", "notification_type", "is_read", "created_at")
    list_filter = ("notification_type", "is_read")
    search_fields = ("message", "user__username")
    autocomplete_fields = ("user", "actor")


# ─────────────────────────────
# Market System (Important)
# ─────────────────────────────

@admin.register(Market)
class MarketAdmin(admin.ModelAdmin):
    list_display = ("poll", "liquidity_b", "yes_shares", "no_shares")
    search_fields = ("poll__title",)
    readonly_fields = ("shares",)


@admin.register(MarketPosition)
class MarketPositionAdmin(admin.ModelAdmin):
    list_display = ("user", "market")
    search_fields = ("user__username",)


@admin.register(MarketPriceSnapshot)
class MarketPriceSnapshotAdmin(admin.ModelAdmin):
    list_display = ("market", "yes_price", "no_price", "created_at")
    list_filter = ("created_at",)
    readonly_fields = ("created_at",)


# ─────────────────────────────
# Challenges (Gamified Betting)
# ─────────────────────────────

@admin.register(Challenge)
class ChallengeAdmin(admin.ModelAdmin):
    list_display = (
        "creator", "opponent", "amount",
        "status", "is_open", "expires_at", "created_at"
    )
    list_filter = ("status", "is_open", "created_at")
    search_fields = ("creator__username", "opponent__username", "question")

    autocomplete_fields = ("creator", "opponent", "poll", "winner")

    fieldsets = (
        ("Participants", {
            "fields": ("creator", "opponent", "is_open")
        }),
        ("Challenge Details", {
            "fields": ("question", "creator_choice", "amount", "poll")
        }),
        ("Resolution", {
            "fields": ("resolution_criteria", "winner", "resolved_at")
        }),
        ("Status & Timing", {
            "fields": ("status", "expires_at", "created_at")
        }),
    )

    readonly_fields = ("created_at",)