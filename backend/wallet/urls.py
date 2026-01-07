from django.urls import path
from .views import WalletHistoryView, WalletSummaryView

urlpatterns = [
    path("history/", WalletHistoryView.as_view(), name="wallet-history"),
    path("summary/", WalletSummaryView.as_view()),
]
