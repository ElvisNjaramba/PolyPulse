# project urls.py

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

from rest_framework_simplejwt.views import TokenRefreshView 
from authentication.views import LoginView

urlpatterns = [
    path("admin/", admin.site.urls),

    path("api/auth/", include("authentication.urls")),
    path("api/", include("base.urls")),
    path("api/wallet/", include("wallet.urls")),

    path("api/auth/login/", LoginView.as_view(), name="token_obtain_pair"),
    path("api/auth/refresh/", TokenRefreshView.as_view()),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
