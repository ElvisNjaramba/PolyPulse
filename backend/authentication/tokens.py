from rest_framework_simplejwt.tokens import RefreshToken

def get_tokens_for_user(user, session):
    refresh = RefreshToken.for_user(user)
    refresh["session_id"] = str(session.session_id)

    return {
        "refresh": str(refresh),
        "access": str(refresh.access_token),
    }
