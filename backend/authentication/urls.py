from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import AuthViewSet, ProfileView, VerifyEmailView
from rest_framework_simplejwt.views import TokenRefreshView

router = DefaultRouter()
router.register("register", AuthViewSet, basename="register")

urlpatterns = [
    path("profile/", ProfileView.as_view(), name="profile"),
    # path("login/", CustomTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("profile/", ProfileView.as_view()),
    path("verify-email/<uuid:token>/", VerifyEmailView.as_view(), name="verify-email"),
]

urlpatterns += router.urls
