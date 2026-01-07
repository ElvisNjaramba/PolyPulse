# authentication/urls.py

from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import AuthViewSet, ProfileView

router = DefaultRouter()
router.register("register", AuthViewSet, basename="register")

urlpatterns = [
    path("profile/", ProfileView.as_view(), name="profile"),
]

urlpatterns += router.urls
