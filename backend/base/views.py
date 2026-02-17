from rest_framework import generics, permissions, status
from rest_framework.response import Response
from django.utils import timezone
from rest_framework.views import APIView

from wallet.services import apply_wallet_transaction

from .mentions import get_mentioned_users
from wallet.models import WalletTransaction
from .permissions import IsCreatorOrAdmin
from rest_framework.permissions import IsAdminUser, IsAuthenticated, AllowAny
from django.db.models import Sum
from .models import CommentLike, Notification, Poll, Bet, PollComment, Market, PollOption, MarketPosition
from .serializers import CommentSerializer, MarketPriceSnapshotSerializer, PollCreateSerializer, PollDetailSerializer, PollListSerializer, BetCreateSerializer, PollResolveSerializer, SellSharesSerializer
from django.db import transaction


class PollCreateView(generics.CreateAPIView):
    serializer_class = PollCreateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        profile = request.user.profile

        if not profile.can_create_poll():
            return Response(
                {"error": "Daily poll creation limit reached"},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = self.get_serializer(
            data=request.data,
            context={"request": request}
        )
        serializer.is_valid(raise_exception=True)

        poll = serializer.save()

        if not request.user.is_staff and not request.user.is_superuser:
            profile.polls_created_today += 1
            profile.last_poll_created_date = timezone.now().date()
            profile.save()

        return Response(
            {"message": "Poll created successfully", "poll_id": poll.id},
            status=status.HTTP_201_CREATED,
        )

class PollListView(generics.ListAPIView):
    serializer_class = PollListSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        queryset = Poll.objects.select_related(
            "creator", "category", "market"
        ).prefetch_related("options", "options__bets")

        category = self.request.query_params.get("category")
        status_filter = self.request.query_params.get("status")
        is_free = self.request.query_params.get("is_free")

        if category:
            queryset = queryset.filter(category__slug=category)

        if status_filter == "open":
            queryset = queryset.filter(status="open", closes_at__gt=timezone.now())
        elif status_filter == "closed":
            queryset = queryset.filter(status__in=["closed", "resolved"])

        if is_free == "true":
            queryset = queryset.filter(is_free=True)
        elif is_free == "false":
            queryset = queryset.filter(is_free=False)

        return queryset.order_by("-created_at")

class PollDetailView(generics.RetrieveAPIView):
    serializer_class = PollDetailSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = "id"

    def get_queryset(self):
        return Poll.objects.select_related(
            "creator", "category"
        ).prefetch_related(
            "options",
            "options__bets",
            "bets"
        )

    def get_object(self):
        poll = super().get_object()

        # 🔥 Ensure market exists
        Market.objects.get_or_create(
            poll=poll,
            defaults={"liquidity_b": 100.0}
        )

        poll.close_if_expired()
        return poll

    
class PollResolveView(APIView):
    permission_classes = [IsCreatorOrAdmin]

    @transaction.atomic
    def post(self, request, poll_id):
        poll = Poll.objects.select_for_update().get(id=poll_id)
        self.check_object_permissions(request, poll)

        serializer = PollResolveSerializer(
            data=request.data,
            context={"poll": poll}
        )
        serializer.is_valid(raise_exception=True)

        poll.winning_option_id = serializer.validated_data["winning_option_id"]
        poll.status = "resolved"
        poll.save()

        total_pool = poll.bets.aggregate(
            total=Sum("amount")
        )["total"] or 0

        winning_bets = Bet.objects.filter(
            poll=poll,
            option=poll.winning_option
        )

        winning_pool = winning_bets.aggregate(
            total=Sum("amount")
        )["total"] or 0

        if winning_pool == 0:
            return Response({"message": "No winners."})

        for bet in winning_bets.select_related("user__profile"):
            payout = int(bet.shares * 1.0)  # 1 per share

            apply_wallet_transaction(
                user=bet.user,
                amount=payout,
                transaction_type="win",
                poll=poll,
                bet=bet,
                description="Market resolution payout"
            )


        return Response({"message": "Poll resolved successfully"})

class PollSuspendView(APIView):
    permission_classes = [IsAdminUser]

    @transaction.atomic
    def post(self, request, poll_id):
        poll = Poll.objects.select_for_update().get(id=poll_id)

        if poll.status in ["resolved", "suspended"]:
            return Response(
                {"error": "Poll cannot be suspended."},
                status=400
            )

        poll.status = "suspended"
        poll.save()

        # 🔄 Refund everyone
        bets = Bet.objects.filter(poll=poll).select_related("user__profile")

        for bet in bets:
            profile = bet.user.profile
            profile.balance += bet.amount
            profile.save()

        return Response({"message": "Poll suspended and bets refunded"})

class LeaderboardView(APIView):
    def get(self, request):
        leaderboard = (
            WalletTransaction.objects
            .filter(transaction_type="win")
            .values("user__username")
            .annotate(total_won=Sum("amount"))
            .order_by("-total_won")[:10]
        )

        return Response(leaderboard)
    
class NotificationListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        notifications = request.user.notifications.all()
        return Response([
            {
                "id": n.id,
                "message": n.message,
                "is_read": n.is_read,
                "created_at": n.created_at,
            }
            for n in notifications
        ])
    
class NotificationReadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, id):
        notification = Notification.objects.get(
            id=id,
            user=request.user
        )
        notification.is_read = True
        notification.save()
        return Response({"success": True})


class NotificationReadAllView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        request.user.notifications.update(is_read=True)
        return Response({"success": True})


class PollCommentView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, poll_id):
        comments = (
            PollComment.objects
            .filter(poll_id=poll_id, parent__isnull=True)
            .select_related("user")
            .prefetch_related("replies", "likes")
        )

        serializer = CommentSerializer(
            comments,
            many=True,
            context={"request": request}
        )
        return Response(serializer.data)

    def post(self, request, poll_id):
        poll = Poll.objects.get(id=poll_id)

        parent_id = request.data.get("parent")
        content = request.data.get("content")

        parent = None
        if parent_id:
            parent = PollComment.objects.get(id=parent_id)

        comment = PollComment.objects.create(
            poll=poll,
            user=request.user,
            content=content,
            parent=parent
        )

        # 🔔 HANDLE @MENTIONS
        mentioned_users = get_mentioned_users(content)

        for user in mentioned_users:
            if user != request.user:
                Notification.objects.create(
                    user=user,
                    actor=request.user,
                    notification_type="mention",
                    message=f"@{request.user.username} mentioned you in a comment"
                )

        return Response(
            CommentSerializer(
                comment,
                context={"request": request}
            ).data,
            status=201
        )

class CommentLikeToggle(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, comment_id):
        comment = PollComment.objects.get(id=comment_id)

        like, created = CommentLike.objects.get_or_create(
            comment=comment,
            user=request.user
        )

        if not created:
            like.delete()
            return Response({"liked": False})

        return Response({"liked": True})

class PlaceBetView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        poll = Poll.objects.get(id=request.data["poll"])
        option = PollOption.objects.get(id=request.data["option"])
        amount = float(request.data["amount"])

        market = Market.objects.select_for_update().get(poll=poll)
        position, _ = MarketPosition.objects.get_or_create(
            user=request.user, market=market
        )

        is_yes = option.is_yes()

        # 💸 Debit wallet
        apply_wallet_transaction(
            user=request.user,
            amount=-amount,
            transaction_type="bet",
            poll=poll,
            description="Market buy"
        )

        shares, price = market.buy(is_yes, amount)
        bet = Bet.objects.create(
            user=request.user,
            poll=poll,
            option=option,
            amount=amount,
            shares=shares
        )


        if is_yes:
            position.yes_shares += shares
            position.yes_spent += amount
        else:
            position.no_shares += shares
            position.no_spent += amount

        position.save()


        return Response({
            "shares": round(shares, 4),
            "price": round(price, 4),
            "new_price": market.price_yes() if is_yes else market.price_no(),
        })

class SellSharesView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request, poll_id):
        option = PollOption.objects.get(id=request.data["option_id"])
        shares = float(request.data["shares"])

        market = Market.objects.select_for_update().get(poll_id=poll_id)
        position = MarketPosition.objects.select_for_update().get(
            user=request.user, market=market
        )

        is_yes = option.is_yes()
        owned = position.yes_shares if is_yes else position.no_shares

        owned = round(owned, 4)
        shares = round(shares, 4)

        if shares <= 0 or shares > owned:
            return Response(
                {"detail": f"Not enough shares. You own {owned}"},
                status=400
            )

        payout = market.sell(is_yes, shares)

        # Handle payout as dict or number
        payout_value = float(payout.get("amount", 0)) if isinstance(payout, dict) else float(payout)

        # Credit wallet
        apply_wallet_transaction(
            user=request.user,
            amount=payout_value,
            transaction_type="refund",
            poll=market.poll,
            description="Market sell"
        )

        # Reduce shares AND cost basis
        if is_yes:
            avg_price = position.avg_yes_price()
            position.yes_shares -= shares
            position.yes_spent -= shares * avg_price
        else:
            avg_price = position.avg_no_price()
            position.no_shares -= shares
            position.no_spent -= shares * avg_price

        position.save()

        return Response({
            "payout": round(payout_value, 4),
            "new_price": round(
                market.price_yes() if is_yes else market.price_no(), 4
            ),
        })

from rest_framework.decorators import api_view, permission_classes
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def user_positions(request):
    user = request.user

    bets = (
        Bet.objects
        .filter(user=user)
        .values(
            "poll__id",
            "poll__title",
            "option__id",
            "option__text",
        )
        .annotate(
            shares=Sum("shares"),
            total_cost=Sum("amount"),
        )
        .filter(shares__gt=0)
    )

    data = []

    for b in bets:
        avg_price = b["total_cost"] / b["shares"]

        # pull live price from market
        option = PollOption.objects.get(id=b["option__id"])
        current_price = option.market_price()

        market_value = b["shares"] * current_price
        pnl = market_value - b["shares"] * avg_price

        data.append({
            "poll_id": b["poll__id"],
            "poll_title": b["poll__title"],
            "option": b["option__text"],
            "shares": round(b["shares"], 4),
            "avg_price": round(avg_price, 4),
            "current_price": round(current_price, 4),
            "value": round(market_value, 2),
            "pnl": round(pnl, 2),
        })

    return Response(data)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def profile_view(request):
    user = request.user

    open_positions = (
        Bet.objects
        .filter(user=user)
        .values("option")
        .annotate(total_shares=Sum("shares"))
        .filter(total_shares__gt=0)
        .count()
    )

    return Response({
        "username": user.username,
        "email": user.email,
        "balance": user.wallet.balance,
        "open_positions": open_positions,  # ✅ THIS IS THE KEY
    })


class MarketPriceHistoryView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, poll_id):
        market = Market.objects.get(poll_id=poll_id)
        qs = market.price_history.all()

        serializer = MarketPriceSnapshotSerializer(qs, many=True)
        return Response(serializer.data)


@api_view(["GET"])
@permission_classes([AllowAny])
def poll_stats(request):
    today = timezone.now().date()

    new_polls_today = Poll.objects.filter(
        created_at__date=today
    ).count()

    total_polls = Poll.objects.count()

    return Response({
        "new_polls_today": new_polls_today,
        "total_polls": total_polls,
    })