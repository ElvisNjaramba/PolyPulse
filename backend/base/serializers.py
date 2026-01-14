from rest_framework import serializers

from wallet.models import WalletTransaction
from .models import MarketPosition, Notification, Poll, PollComment, PollOption, Bet
from django.db.models import Sum
from .models import Market

class PollOptionSerializer(serializers.ModelSerializer):
    price = serializers.SerializerMethodField()
    user_shares = serializers.SerializerMethodField()
    total_shares = serializers.SerializerMethodField()
    avg_price = serializers.SerializerMethodField()
    pnl = serializers.SerializerMethodField()

    class Meta:
        model = PollOption
        fields = [
            "id",
            "text",
            "price",
            "user_shares",
            "total_shares",
            "avg_price",
            "pnl",
        ]

    def get_price(self, obj):
        market = obj.poll.market
        is_yes = obj.is_yes()
        return round(
            market.price_yes() if is_yes else market.price_no(),
            4
        )

    def get_user_shares(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return 0

        market = obj.poll.market
        position = MarketPosition.objects.filter(
            user=request.user,
            market=market
        ).first()

        if not position:
            return 0

        return round(
            position.yes_shares if obj.is_yes() else position.no_shares,
            4
        )

    def get_total_shares(self, obj):
        market = obj.poll.market
        return round(
            market.yes_shares if obj.is_yes() else market.no_shares,
            4
        )

    def get_avg_price(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return 0

        position = MarketPosition.objects.filter(
            user=request.user,
            market=obj.poll.market
        ).first()

        if not position:
            return 0

        return round(
            position.avg_yes_price()
            if obj.is_yes()
            else position.avg_no_price(),
            4
        )


    def get_pnl(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return 0

        market = obj.poll.market
        position = MarketPosition.objects.filter(
            user=request.user,
            market=market
        ).first()

        if not position:
            return 0

        if obj.is_yes():
            shares = position.yes_shares
            spent = position.yes_spent
            price = market.price_yes()
        else:
            shares = position.no_shares
            spent = position.no_spent
            price = market.price_no()

        value = shares * price
        return round(value - spent, 2)

class PollDetailSerializer(serializers.ModelSerializer):
    options = PollOptionSerializer(many=True)
    can_accept_bets = serializers.SerializerMethodField()
    total_pool = serializers.SerializerMethodField()

    class Meta:
        model = Poll
        fields = [
            "id",
            "title",
            "description",
            "is_free",
            "min_bet",
            "status",
            "closes_at",
            "can_accept_bets",
            "total_pool",
            "options",
        ]

    def get_can_accept_bets(self, obj):
        return obj.can_accept_bets()

    def get_total_pool(self, obj):
        return (
            WalletTransaction.objects.filter(
                related_poll=obj,
                transaction_type="bet"
            ).aggregate(total=Sum("amount"))["total"]
            or 0
        )

class PollCreateSerializer(serializers.ModelSerializer):
    options = PollOptionSerializer(many=True)

    class Meta:
        model = Poll
        fields = [
            "title",
            "description",
            "category",
            "is_free",
            "min_bet",
            "closes_at",
            "options",
        ]

    def validate_options(self, value):
        texts = {opt["text"].lower() for opt in value}
        if texts != {"yes", "no"}:
            raise serializers.ValidationError(
                "Market polls must have exactly two options: Yes and No"
            )
        return value


    def create(self, validated_data):
        options_data = validated_data.pop("options")
        user = self.context["request"].user

        poll = Poll.objects.create(
            creator=user,
            **validated_data
        )

        for option in options_data:
            PollOption.objects.create(
                poll=poll,
                text=option["text"]
            )

        Market.objects.create(
            poll=poll,
            liquidity_b=100.0
        )

        return poll

class PollOptionReadSerializer(serializers.ModelSerializer):
    class Meta:
        model = PollOption
        fields = ["id", "text"]


class PollListSerializer(serializers.ModelSerializer):
    creator = serializers.StringRelatedField()
    category = serializers.StringRelatedField()
    options = PollOptionReadSerializer(many=True)

    class Meta:
        model = Poll
        fields = [
            "id",
            "title",
            "description",
            "creator",
            "category",
            "is_free",
            "min_bet",
            "closes_at",
            "created_at",
            "options",
        ]

class BetCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Bet
        fields = ["poll", "option", "amount"]

    def validate(self, data):
        poll = data["poll"]
        option = data["option"]
        amount = data.get("amount", 0)
        user = self.context["request"].user
        profile = user.profile
        market = poll.market
        price = market.price_yes() if option == poll.options.first() else market.price_no()

        if amount > market.liquidity_b * 2:
            raise serializers.ValidationError(
                "Order too large — split into smaller trades."
            )

        if option.poll_id != poll.id:
            raise serializers.ValidationError("Invalid option for this poll.")

        if not poll.is_free:
            if amount < poll.min_bet:
                raise serializers.ValidationError(
                    f"Minimum bet is {poll.min_bet}"
                )

            if profile.balance < amount:
                raise serializers.ValidationError("Insufficient balance.")

        if poll.is_free and amount > 0:
            raise serializers.ValidationError(
                "Free polls do not require a bet."
            )

        if Bet.objects.filter(user=user, poll=poll).exists():
            raise serializers.ValidationError(
                "You have already placed a bet on this poll."
            )

        return data

class PollOptionDetailSerializer(serializers.ModelSerializer):
    price = serializers.SerializerMethodField()

    class Meta:
        model = PollOption
        fields = ["id", "text", "price"]

    def get_price(self, obj):
        market = obj.poll.market
        is_yes = obj == obj.poll.options.first()
        return round(
            market.price_yes() if is_yes else market.price_no(),
            4
        )

# base/serializers.py

class MarketOptionSerializer(serializers.ModelSerializer):
    price = serializers.SerializerMethodField()
    user_shares = serializers.SerializerMethodField()

    class Meta:
        model = PollOption
        fields = ["id", "text", "price", "user_shares"]

    def get_price(self, obj):
        market = obj.poll.market
        return (
            market.price_yes()
            if obj.text.lower() == "yes"
            else market.price_no()
        )

    def get_user_shares(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return 0

        market = obj.poll.market

        position = MarketPosition.objects.filter(
            user=request.user,
            market=market
        ).first()

        if not position:
            return 0

        return (
            position.yes_shares
            if obj.text.lower() == "yes"
            else position.no_shares
        )

class PollResolveSerializer(serializers.Serializer):
    winning_option_id = serializers.IntegerField()

    def validate(self, data):
        poll = self.context["poll"]

        if poll.status != "open":
            raise serializers.ValidationError(
                "Only open polls can be resolved."
            )

        try:
            PollOption.objects.get(
                id=data["winning_option_id"],
                poll=poll
            )
        except PollOption.DoesNotExist:
            raise serializers.ValidationError("Invalid option.")

        return data

class RecursiveCommentSerializer(serializers.Serializer):
    def to_representation(self, value):
        serializer = CommentSerializer(value, context=self.context)
        return serializer.data


class CommentSerializer(serializers.ModelSerializer):
    user = serializers.CharField(source="user.username", read_only=True)
    replies = RecursiveCommentSerializer(many=True, read_only=True)
    likes_count = serializers.IntegerField(source="likes.count", read_only=True)
    is_liked = serializers.SerializerMethodField()

    class Meta:
        model = PollComment
        fields = [
            "id",
            "user",
            "content",
            "created_at",
            "likes_count",
            "is_liked",
            "replies",
        ]

    def get_is_liked(self, obj):
        user = self.context["request"].user
        if user.is_anonymous:
            return False
        return obj.likes.filter(user=user).exists()

class NotificationSerializer(serializers.ModelSerializer):
    actor = serializers.CharField(source="actor.username", read_only=True)

    class Meta:
        model = Notification
        fields = [
            "id",
            "actor",
            "notification_type",
            "message",
            "is_read",
            "created_at",
        ]

class SellSharesSerializer(serializers.Serializer):
    option_id = serializers.IntegerField()
    shares = serializers.FloatField(min_value=0.0001)


