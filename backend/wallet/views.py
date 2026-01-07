from rest_framework.generics import ListAPIView
from rest_framework.permissions import IsAuthenticated
from .models import WalletTransaction, WalletTransaction
from .serializers import WalletTransactionSerializer
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Sum

class WalletHistoryView(ListAPIView):
    serializer_class = WalletTransactionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return WalletTransaction.objects.filter(user=self.request.user)

class WalletSummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        today = timezone.now().date()

        qs = WalletTransaction.objects.filter(
            user=request.user,
            created_at__date=today
        )

        total_wins = qs.filter(transaction_type="win").aggregate(
            total=Sum("amount")
        )["total"] or 0

        total_bets = qs.filter(transaction_type="bet").aggregate(
            total=Sum("amount")
        )["total"] or 0

        total_refunds = qs.filter(transaction_type="refund").aggregate(
            total=Sum("amount")
        )["total"] or 0

        net_profit = total_wins + total_bets + total_refunds

        return Response({
            "date": today,
            "total_wins": total_wins,
            "total_bets": abs(total_bets),
            "total_refunds": total_refunds,
            "net_profit": net_profit,
            "current_balance": request.user.profile.balance,
        })