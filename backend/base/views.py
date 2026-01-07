from rest_framework import generics, permissions, status
from rest_framework.response import Response
from django.utils import timezone
from rest_framework.views import APIView

from .mentions import get_mentioned_users
from wallet.models import WalletTransaction
from .permissions import IsCreatorOrAdmin
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from django.db.models import Sum
from .models import CommentLike, Notification, Poll, Bet, PollComment
from .serializers import CommentSerializer, PollCreateSerializer, PollDetailSerializer, PollListSerializer, BetCreateSerializer, PollResolveSerializer
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
            "creator", "category"
        ).prefetch_related("options")

        category = self.request.query_params.get("category")
        status = self.request.query_params.get("status")
        is_free = self.request.query_params.get("is_free")

        if category:
            queryset = queryset.filter(category__slug=category)

        if status == "open":
            queryset = queryset.filter(closes_at__gt=timezone.now())

        if is_free == "true":
            queryset = queryset.filter(is_free=True)
        elif is_free == "false":
            queryset = queryset.filter(is_free=False)

        return queryset.order_by("-created_at")

class PlaceBetView(generics.CreateAPIView):
    serializer_class = BetCreateSerializer
    permission_classes = [permissions.IsAuthenticated]

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(
            data=request.data,
            context={"request": request}
        )
        serializer.is_valid(raise_exception=True)

        bet = serializer.save(user=request.user)

        poll = bet.poll
        profile = request.user.profile

        # 💸 Deduct balance (paid polls only)
        if not poll.is_free:
            profile.balance -= bet.amount
            profile.save()

        return Response(
            {
                "message": "Bet placed successfully",
                "remaining_balance": profile.balance,
            },
            status=status.HTTP_201_CREATED,
        )

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

        # 🔥 CRITICAL
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
            payout = int((bet.amount / winning_pool) * total_pool)
            profile = bet.user.profile
            profile.balance += payout
            profile.save()

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

