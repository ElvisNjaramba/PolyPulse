from django.contrib import admin
from django.contrib.auth.models import User
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import Profile

class ProfileInline(admin.StackedInline):
    model = Profile
    fk_name = "user" 
    can_delete = False
    extra = 0
    fields = (
        "phone_number",
        "balance",
        "polls_created_today",
        "last_poll_created_date",
        "created_at",
    )
    readonly_fields = ("created_at",)

class UserAdmin(BaseUserAdmin):
    inlines = (ProfileInline,)

    list_display = (
        "username",
        "email",
        "is_staff",
        "is_superuser",
        "date_joined",
    )

    list_filter = ("is_staff", "is_superuser", "is_active")
    search_fields = ("username", "email")
    ordering = ("-date_joined",)


admin.site.unregister(User)

admin.site.register(User, UserAdmin)

@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = (
        "user",
        "phone_number",
        "balance",
        "polls_created_today",
        "last_poll_created_date",
        "created_at",
    )

    search_fields = (
        "user__username",
        "user__email",
        "phone_number",
    )

    list_filter = ("created_at",)
    ordering = ("-created_at",)
