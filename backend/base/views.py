from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from django.utils import timezone
from datetime import timedelta
from rest_framework.views import APIView

from wallet.services import apply_wallet_transaction
from rest_framework.generics import ListAPIView
from .mentions import get_mentioned_users
from wallet.models import WalletTransaction
from .permissions import IsCreatorOrAdmin
from rest_framework.permissions import IsAdminUser, IsAuthenticated, AllowAny
from django.db.models import Sum
from .models import CommentLike, Notification, Poll, Bet, PollCategory, PollComment, Market, PollOption, MarketPosition
from .serializers import CommentSerializer, MarketPriceSnapshotSerializer, PollCategorySerializer, PollCreateSerializer, PollDetailSerializer, PollListSerializer, BetCreateSerializer, PollResolveSerializer, SellSharesSerializer
from django.db import transaction
from django.contrib.auth.models import User


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

        if not request.data.get("is_free", False) and not request.user.is_staff and not request.user.is_superuser:
            return Response(
                {"error": "Real-money market creation is currently restricted. Only free markets can be created at this time."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = self.get_serializer(data=request.data, context={"request": request})
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
        creator = self.request.query_params.get('creator')

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

        if creator:
            if creator == 'me' and self.request.user.is_authenticated:
                queryset = queryset.filter(creator=self.request.user)
            else:
                # assume numeric ID passed
                queryset = queryset.filter(creator_id=creator)

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
        poll.close_if_expired()
        return poll

    
class PollResolveView(APIView):
    permission_classes = [IsCreatorOrAdmin]

    @transaction.atomic
    def post(self, request, poll_id):
        poll = Poll.objects.select_for_update().get(id=poll_id)
        if timezone.now() < poll.closes_at:
            time_left = poll.closes_at - timezone.now()
            hours, remainder = divmod(int(time_left.total_seconds()), 3600)
            minutes = remainder // 60
            return Response(
                {"error": f"Market cannot be resolved yet. It closes in {hours}h {minutes}m."},
                status=status.HTTP_403_FORBIDDEN,
            )
        self.check_object_permissions(request, poll)

        serializer = PollResolveSerializer(
            data=request.data,
            context={"poll": poll}
        )
        serializer.is_valid(raise_exception=True)

        poll.winning_option_id = serializer.validated_data["winning_option_id"]
        poll.status = "resolved"
        poll.save()

        total_pool = poll.bets.aggregate(total=Sum("amount"))["total"] or 0
        winning_bets = Bet.objects.filter(poll=poll, option=poll.winning_option)
        winning_pool = winning_bets.aggregate(total=Sum("amount"))["total"] or 0

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

            Notification.objects.create(
                user=bet.user,
                actor=None,
                notification_type='bet_won',
                message=f'You won Kes {payout} on "{poll.title}"'
            )

        # Update streaks and accuracy for all bettors on this poll
        all_bettors = (
            Bet.objects
            .filter(poll=poll)
            .select_related("user__profile")
            .values_list("user_id", flat=True)
            .distinct()
        )
        for user_id in all_bettors:
            profile = Poll.objects.get(id=poll_id)  # already fetched — use bet.user.profile below
            break  # placeholder — real loop below

        # Update streaks and prediction accuracy for every bettor on this poll
        bettor_profiles = {
            b.user_id: b.user.profile
            for b in Bet.objects.filter(poll=poll).select_related("user__profile")
        }
        winner_ids = set(
            Bet.objects.filter(poll=poll, option=poll.winning_option)
            .values_list("user_id", flat=True)
            .distinct()
        )
        for user_id, profile in bettor_profiles.items():
            profile.total_predictions += 1
            if user_id in winner_ids:
                profile.current_streak += 1
                profile.best_streak = max(profile.best_streak, profile.current_streak)
                profile.correct_predictions += 1
            else:
                profile.current_streak = 0
            profile.save(update_fields=[
                "total_predictions", "correct_predictions",
                "current_streak", "best_streak",
            ])

        return Response({"message": "Poll resolved successfully"})

class PollSuspendView(APIView):
    permission_classes = [IsCreatorOrAdmin]

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

class PollCancelView(APIView):
    permission_classes = [IsCreatorOrAdmin]   # allows creator or admin

    @transaction.atomic
    def post(self, request, poll_id):
        poll = Poll.objects.select_for_update().get(id=poll_id)
        self.check_object_permissions(request, poll)

        if poll.status in ["resolved", "suspended", "cancelled"]:
            return Response(
                {"error": "Poll cannot be cancelled."},
                status=400
            )

        poll.status = "cancelled"
        poll.save()

        # Refund all bets (optional – remove if you don't want refund)
        bets = Bet.objects.filter(poll=poll).select_related("user__profile")
        for bet in bets:
            profile = bet.user.profile
            profile.balance += bet.amount
            profile.save()

        return Response({"message": "Poll cancelled and bets refunded"})

class LeaderboardView(APIView):
    def get(self, request):
        # ── Top-10 global leaderboard ──────────────────────────────────
        top_qs = (
            WalletTransaction.objects
            .filter(transaction_type="win")
            .values("user__id", "user__username")
            .annotate(total_won=Sum("amount"))
            .order_by("-total_won")[:10]
        )

        leaderboard = []
        for rank, entry in enumerate(top_qs, 1):
            try:
                from django.contrib.auth import get_user_model
                User = get_user_model()
                profile = User.objects.get(id=entry["user__id"]).profile
                total = profile.total_predictions
                accuracy = round(profile.correct_predictions / total * 100, 1) if total else 0
                streak = profile.current_streak
                best_streak = profile.best_streak
            except Exception:
                accuracy = streak = best_streak = 0

            leaderboard.append({
                "rank": rank,
                "username": entry["user__username"],
                "total_won": round(entry["total_won"], 2),
                "current_streak": streak,
                "best_streak": best_streak,
                "accuracy": accuracy,
            })

        # ── Requesting user's personal stats ──────────────────────────
        my_stats = None
        if request.user.is_authenticated:
            # Compute global rank
            all_ranks = (
                WalletTransaction.objects
                .filter(transaction_type="win")
                .values("user__id")
                .annotate(total_won=Sum("amount"))
                .order_by("-total_won")
            )
            my_rank = next(
                (i + 1 for i, r in enumerate(all_ranks) if r["user__id"] == request.user.id),
                None
            )
            my_total = (
                WalletTransaction.objects
                .filter(user=request.user, transaction_type="win")
                .aggregate(total=Sum("amount"))["total"] or 0
            )

            today = timezone.now().date()
            yesterday = today - timedelta(days=1)
            today_wins = (
                WalletTransaction.objects
                .filter(user=request.user, transaction_type="win", created_at__date=today)
                .aggregate(total=Sum("amount"))["total"] or 0
            )
            yesterday_wins = (
                WalletTransaction.objects
                .filter(user=request.user, transaction_type="win", created_at__date=yesterday)
                .aggregate(total=Sum("amount"))["total"] or 0
            )

            profile = request.user.profile
            total = profile.total_predictions
            accuracy = round(profile.correct_predictions / total * 100, 1) if total else 0

            my_stats = {
                "rank": my_rank,
                "total_won": round(my_total, 2),
                "current_streak": profile.current_streak,
                "best_streak": profile.best_streak,
                "accuracy": accuracy,
                "today_winnings": round(today_wins, 2),
                "yesterday_winnings": round(yesterday_wins, 2),
                "daily_change": round(today_wins - yesterday_wins, 2),
            }

        return Response({"leaderboard": leaderboard, "my_stats": my_stats})
        

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
        serializer = BetCreateSerializer(
            data=request.data,
            context={"request": request}
        )
        serializer.is_valid(raise_exception=True)

        poll   = serializer.validated_data["poll"]
        option = serializer.validated_data["option"]
        amount = serializer.validated_data["amount"]

        market = Market.objects.select_for_update().get(poll=poll)

        position, _ = MarketPosition.objects.get_or_create(
            user=request.user,
            market=market
        )

        is_yes = option.is_yes()

        # 💸 Debit wallet BEFORE trade so balance is always consistent
        apply_wallet_transaction(
            user=request.user,
            amount=-amount,
            transaction_type="bet",
            poll=poll,
            description="Market buy"
        )

        # buy() now returns (shares_issued, current_price) correctly
        shares, new_price = market.buy(option=option, amount=amount)

        Bet.objects.create(
            user=request.user,
            poll=poll,
            option=option,
            amount=amount,
            shares=shares,
        )

        # Update position — shares and spent tracked separately
        key = str(option.id)
        position.option_shares[key] = position.option_shares.get(key, 0.0) + shares
        position.option_spent[key]  = position.option_spent.get(key, 0.0) + amount

        # sync legacy binary columns
        opts = list(poll.options.all())
        if len(opts) == 2:
            position.yes_shares = position.option_shares.get(str(opts[0].id), 0.0)
            position.no_shares  = position.option_shares.get(str(opts[1].id), 0.0)
            position.yes_spent  = position.option_spent.get(str(opts[0].id), 0.0)
            position.no_spent   = position.option_spent.get(str(opts[1].id), 0.0)

        position.save()

        return Response({
            "shares":    round(shares, 4),
            "new_price": round(new_price, 4),
        })

class SellSharesView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request, poll_id):
        option = PollOption.objects.get(id=request.data["option_id"])
        shares = float(request.data["shares"])

        market   = Market.objects.select_for_update().get(poll_id=poll_id)
        position = MarketPosition.objects.select_for_update().get(
            user=request.user, market=market
        )

        owned = position.shares_for(option)

        if shares <= 0 or shares > owned:
            return Response(
                {"detail": f"Invalid share amount. You own {owned:.4f} shares."},
                status=400
            )

        result = market.sell(option=option, shares=shares)

        payout_value = float(result["refund"])

        if payout_value <= 0:
            return Response(
                {"detail": "Sell failed — payout is zero."},
                status=400
            )

        apply_wallet_transaction(
            user=request.user,
            amount=payout_value,
            transaction_type="refund",
            poll=market.poll,
            description="Market sell"
        )

        # ✅ Reduce position — clamp spent to 0 to avoid float drift going negative
        key = str(option.id)
        avg_price = position.spent_for(option) / owned if owned else 0
        position.option_shares[key] = max(0.0, position.option_shares.get(key, 0.0) - shares)
        position.option_spent[key]  = max(0.0, position.option_spent.get(key, 0.0) - shares * avg_price)

        # keep legacy binary columns in sync for 2-option markets
        opts = list(market.poll.options.all())
        if len(opts) == 2:
            position.yes_shares = position.option_shares.get(str(opts[0].id), 0.0)
            position.no_shares  = position.option_shares.get(str(opts[1].id), 0.0)
            position.yes_spent  = position.option_spent.get(str(opts[0].id), 0.0)
            position.no_spent   = position.option_spent.get(str(opts[1].id), 0.0)

        position.save()

        return Response({
            "payout":    round(payout_value, 4),
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
            "poll__status",
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

        # Pull live price from the related market
        option = PollOption.objects.get(id=b["option__id"])
        market = option.poll.market
        current_price = market.price_yes() if option.is_yes() else market.price_no()

        # Calculate PnL
        market_value = b["shares"] * current_price
        pnl = market_value - b["shares"] * avg_price

        data.append({
            "poll_id": b["poll__id"],
            "poll_title": b["poll__title"],
            "option": b["option__text"],
            "shares": round(b["shares"], 4),
            "avg_price": round(avg_price, 4),
            "current_price": round(current_price, 4),
            "pnl": round(pnl, 2),
            "status": b["poll__status"],
        })

    return Response(data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def profile_view(request):
    user = request.user
    profile = user.profile
 
    # Reset stale counter so the frontend sees the correct value
    today = timezone.now().date()
    if profile.last_poll_created_date != today:
        profile.polls_created_today = 0
        profile.last_poll_created_date = today
        profile.save(update_fields=["polls_created_today", "last_poll_created_date"])
 
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
        "balance": profile.balance,
        "open_positions": open_positions,
        "polls_created_today": profile.polls_created_today,   # ← NEW: used by CreatePoll counter
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
    new_polls_today = Poll.objects.filter(created_at__date=today).count()
    total_polls = Poll.objects.count()
    active_traders = User.objects.filter(bet__isnull=False).distinct().count()
    return Response({
        "new_polls_today": new_polls_today,
        "total_polls": total_polls,
        "active_traders": active_traders,
    })

class PollCategoryListView(ListAPIView):
    queryset = PollCategory.objects.all()
    serializer_class = PollCategorySerializer
    permission_classes = [permissions.AllowAny]

from .models import Challenge
from .serializers import ChallengeSerializer, ChallengeCreateSerializer
from rest_framework import status
from django.db.models import Q

class ChallengeListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ChallengeSerializer

    def get_queryset(self):
        user = self.request.user
        return Challenge.objects.filter(
            Q(creator=user) | Q(opponent=user)
        ).order_by('-created_at')

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return ChallengeCreateSerializer
        return ChallengeSerializer

    def perform_create(self, serializer):
        challenge = serializer.save(creator=self.request.user)

        if not challenge.is_open and challenge.opponent:
            Notification.objects.create(
                user=challenge.opponent,
                actor=self.request.user,
                notification_type='challenge_received',
                message=f'{self.request.user.username} challenged you: "{challenge.question}" for Kes {challenge.amount}'
            )

        if challenge.is_open:
            # Notify participants of the linked poll if provided
            from .models import Bet
            poll_filter = {'poll': challenge.poll} if challenge.poll else {'poll__title__icontains': challenge.question[:20]}
            participants = (
                Bet.objects
                .filter(**poll_filter)
                .exclude(user=self.request.user)
                .values_list('user', flat=True)
                .distinct()
            )
            for user_id in participants:
                Notification.objects.create(
                    user_id=user_id,
                    actor=self.request.user,
                    notification_type='market_challenge',
                    message=f'Open challenge on a market you traded: "{challenge.question}" – Kes {challenge.amount}. Accept it!'
                )

class AcceptOpenChallengeView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request, pk):
        challenge = get_object_or_404(Challenge, pk=pk, is_open=True)
        
        if challenge.creator == request.user:
            return Response({'error': 'Cannot accept your own challenge'}, status=400)
        if challenge.status != 'pending':
            return Response({'error': 'Challenge no longer available'}, status=400)
        if challenge.opponent:
            return Response({'error': 'Challenge already taken'}, status=400)
        if timezone.now() > challenge.expires_at:
            challenge.status = 'expired'
            challenge.save()
            return Response({'error': 'Challenge expired'}, status=400)

        amount_float = float(challenge.amount)
        if challenge.creator.profile.balance < amount_float or request.user.profile.balance < amount_float:
            return Response({'error': 'Insufficient balance'}, status=400)

        challenge.creator.profile.balance -= amount_float
        challenge.creator.profile.save()
        request.user.profile.balance -= amount_float
        request.user.profile.save()

        challenge.opponent = request.user
        challenge.status = 'accepted'
        challenge.is_open = False
        challenge.save()

        Notification.objects.create(
            user=challenge.creator,
            actor=request.user,
            notification_type='challenge_accepted',
            message=f'{request.user.username} accepted your open challenge: "{challenge.question}"'
        )
        return Response({'message': 'Challenge accepted'})
        
class ChallengeDetailView(generics.RetrieveAPIView):
    permission_classes = [IsAuthenticated]
    queryset = Challenge.objects.all()
    serializer_class = ChallengeSerializer

class ChallengeAcceptView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request, pk):
        challenge = get_object_or_404(Challenge, pk=pk)
        if challenge.opponent != request.user:
            return Response({'error': 'Not your challenge'}, status=403)
        if challenge.status != 'pending':
            return Response({'error': 'Challenge not pending'}, status=400)
        if timezone.now() > challenge.expires_at:
            challenge.status = 'expired'
            challenge.save()
            return Response({'error': 'Challenge expired'}, status=400)

        amount_float = float(challenge.amount)

        creator_balance = challenge.creator.profile.balance
        opponent_balance = request.user.profile.balance
        if creator_balance < amount_float or opponent_balance < amount_float:
            return Response({'error': 'Insufficient balance'}, status=400)

        challenge.creator.profile.balance -= amount_float
        challenge.creator.profile.save()
        request.user.profile.balance -= amount_float
        request.user.profile.save()

        challenge.status = 'accepted'
        challenge.save()

        Notification.objects.create(
            user=challenge.creator,
            actor=request.user,
            notification_type='challenge_accepted',
            message=f'{request.user.username} accepted your challenge: {challenge.question}'
        )
        return Response({'message': 'Challenge accepted'})
    

class ChallengeResolveView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request, pk):
        challenge = get_object_or_404(Challenge, pk=pk)
        if challenge.creator != request.user and challenge.opponent != request.user:
            return Response({'error': 'Not your challenge'}, status=403)
        if challenge.status != 'accepted':
            return Response({'error': 'Challenge not accepted'}, status=400)

        winning_outcome = request.data.get('winning_outcome')
        if winning_outcome not in ['yes', 'no']:
            return Response({'error': 'Invalid outcome'}, status=400)

        if challenge.creator_choice == winning_outcome:
            winner = challenge.creator
        else:
            winner = challenge.opponent

        payout = float(challenge.amount) * 2

        winner.profile.balance += payout
        winner.profile.save()

        challenge.status = 'resolved'
        challenge.winner = winner
        challenge.save()

        Notification.objects.create(
            user=winner,
            actor=None,
            notification_type='challenge_won',
            message=f'You won the challenge "{challenge.question}" and received Kes {payout}'
        )

        loser = challenge.opponent if winner == challenge.creator else challenge.creator
        Notification.objects.create(
            user=loser,
            actor=None,
            notification_type='challenge_lost',
            message=f'You lost the challenge "{challenge.question}"'
        )

        return Response({'message': 'Challenge resolved', 'winner': winner.username})


class ChallengeCancelView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        challenge = get_object_or_404(Challenge, pk=pk)
        if challenge.creator != request.user:
            return Response({'error': 'Only creator can cancel'}, status=403)
        if challenge.status not in ['pending', 'accepted']:
            return Response({'error': 'Cannot cancel now'}, status=400)

        if challenge.status == 'accepted':
            # Refund both
            challenge.creator.profile.balance += challenge.amount
            challenge.creator.profile.save()
            challenge.opponent.profile.balance += challenge.amount
            challenge.opponent.profile.save()

        original_status = challenge.status
        challenge.status = 'cancelled'
        challenge.save()

        if original_status == 'accepted':
            Notification.objects.create(
                user=challenge.opponent,
                actor=request.user,
                notification_type='challenge_cancelled',
                message=f'{request.user.username} cancelled the challenge "{challenge.question}" – funds refunded'
            )
        return Response({'message': 'Challenge cancelled'})


class PublicChallengeListView(generics.ListAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = ChallengeSerializer

    def get_queryset(self):
        qs = Challenge.objects.order_by('-created_at')
        poll_id = self.request.query_params.get('poll')
        if poll_id:
            qs = qs.filter(poll_id=poll_id)
        else:
            qs = qs.filter(is_open=True)
        return qs