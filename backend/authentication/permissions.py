from rest_framework.permissions import BasePermission
from authentication.models import UserSession

class IsActiveSession(BasePermission):
    def has_permission(self, request, view):
        token = request.auth
        if not token:
            return False

        session_id = token.get("session_id")
        return UserSession.objects.filter(
            user=request.user,
            session_id=session_id,
            is_active=True
        ).exists()