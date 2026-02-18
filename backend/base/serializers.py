from rest_framework import serializers

from wallet.models import WalletTransaction
from .models import Challenge, MarketPosition, MarketPriceSnapshot, Notification, Poll, PollCategory, PollComment, PollOption, Bet, User
from django.db.models import Sum
from .models import Market
from django.contrib.auth import get_user_model

User = get_user_model()


class PollOptionSerializer(serializers.ModelSerializer):
    price = serializers.SerializerMethodField()
    user_shares = serializers.SerializerMethodField()
    user_ids = serializers.SerializerMethodField()
    total_shares = serializers.SerializerMethodField()
    avg_price = serializers.SerializerMethodField()
    pnl = serializers.SerializerMethodField()
    volume = serializers.SerializerMethodField()


    class Meta:
        model = PollOption
        fields = [
            "id",
            "text",
            "price",
            "user_shares",
            "user_ids",
            "total_shares",
            "avg_price",
            "pnl",
            "volume",
        ]

    def get_price(self, obj):
        market = obj.poll.market
        return market.price_yes() if obj.text.lower() == "yes" else market.price_no()
    
    def get_volume(self, obj):
        total = obj.bets.aggregate(total=Sum("amount"))["total"]
        return round(total or 0, 2)

    def get_user_shares(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return 0
        market = obj.poll.market
        position = MarketPosition.objects.filter(user=request.user, market=market).first()
        if not position:
            return 0
        return position.yes_shares if obj.text.lower() == "yes" else position.no_shares

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
    
    def get_user_ids(self, obj):
        # Return unique user IDs who have placed bets on this option
        return list(obj.bets.values_list("user_id", flat=True).distinct())

class PollDetailSerializer(serializers.ModelSerializer):
    options = PollOptionSerializer(many=True)
    can_accept_bets = serializers.SerializerMethodField()
    total_pool = serializers.SerializerMethodField()
    all_user_ids = serializers.SerializerMethodField()

    # 🔥 NEW FIELDS
    yes_shares = serializers.SerializerMethodField()
    no_shares = serializers.SerializerMethodField()
    yes_percentage = serializers.SerializerMethodField()
    no_percentage = serializers.SerializerMethodField()

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
            "yes_shares",
            "no_shares",
            "yes_percentage",
            "no_percentage",
            "options",
            "all_user_ids",
            "category",     
            "created_at",
        ]

    def get_can_accept_bets(self, obj):
        return obj.can_accept_bets()

    def get_total_pool(self, obj):
        market = getattr(obj, "market", None)
        if not market:
            return 0
        
        yes_value = market.yes_shares * market.price_yes()
        no_value = market.no_shares * market.price_no()

        return round(yes_value + no_value, 2)




    def get_all_user_ids(self, obj):
        all_ids = set()
        for option in obj.options.all():
            all_ids.update(option.bets.values_list("user_id", flat=True))
        return list(all_ids)

    # 🔥 YES / NO TOTAL SHARES
    def get_yes_shares(self, obj):
        market = obj.market
        return round(market.yes_shares, 4)

    def get_no_shares(self, obj):
        market = obj.market
        return round(market.no_shares, 4)

    # 🔥 PERCENTAGES (SAFE)
    def get_yes_percentage(self, obj):
        market = obj.market
        total = market.yes_shares + market.no_shares
        if total == 0:
            return 50
        return round((market.yes_shares / total) * 100, 2)

    def get_no_percentage(self, obj):
        market = obj.market
        total = market.yes_shares + market.no_shares
        if total == 0:
            return 50
        return round((market.no_shares / total) * 100, 2)

class PollCreateSerializer(serializers.ModelSerializer):
    category = serializers.SlugRelatedField(
        queryset=PollCategory.objects.all(),
        slug_field="slug"
    )
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

        return poll

class PollOptionReadSerializer(serializers.ModelSerializer):
    price = serializers.SerializerMethodField()
    
    class Meta:
        model = PollOption
        fields = ["id", "text", "price"]

    def get_price(self, obj):
        try:
            market = obj.poll.market
            if obj.text.lower() == "yes":
                return market.price_yes()
            return market.price_no()
        except (Market.DoesNotExist, AttributeError):
            return 0.5  


class PollListSerializer(serializers.ModelSerializer):
    creator = serializers.StringRelatedField()
    category = serializers.StringRelatedField()
    options = PollOptionReadSerializer(many=True)
    total_pool = serializers.SerializerMethodField()
    all_user_ids = serializers.SerializerMethodField()
    status = serializers.CharField(read_only=True)

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
            "status",
            "closes_at",
            "created_at",
            "options",
            "total_pool",
            "all_user_ids",
        ]

    def get_total_pool(self, obj):
        market = getattr(obj, "market", None)
        if not market:
            return 0
        
        yes_value = market.yes_shares * market.price_yes()
        no_value = market.no_shares * market.price_no()
        return round(yes_value + no_value, 2)

    def get_all_user_ids(self, obj):
        all_ids = set()
        for option in obj.options.all():
            all_ids.update(option.bets.values_list("user_id", flat=True))
        return list(all_ids)

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

        if poll.is_free:
            data["amount"] = 1.0
        else:
            if amount < poll.min_bet:
                raise serializers.ValidationError(
                    f"Minimum bet is {poll.min_bet}"
                )

            if profile.balance < amount:
                raise serializers.ValidationError(
                    "Insufficient balance."
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


class MarketPriceSnapshotSerializer(serializers.ModelSerializer):
    class Meta:
        model = MarketPriceSnapshot
        fields = ["yes_price", "no_price", "created_at"]


class PollCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = PollCategory
        fields = ['id', 'name', 'slug']



class ChallengeSerializer(serializers.ModelSerializer):
    creator_username = serializers.CharField(source='creator.username', read_only=True)
    opponent_username = serializers.CharField(source='opponent.username', read_only=True)
    is_creator = serializers.SerializerMethodField()
    is_opponent = serializers.SerializerMethodField()
    creator_choice_display = serializers.CharField(source='get_creator_choice_display', read_only=True)
    opponent_choice = serializers.SerializerMethodField()

    class Meta:
        model = Challenge
        fields = [
            'id', 'creator', 'creator_username', 'opponent', 'opponent_username',
            'amount', 'question', 'status', 'expires_at', 'winner', 'created_at',
            'is_creator', 'is_opponent', 'creator_choice', 'creator_choice_display', 'opponent_choice'
        ]
        read_only_fields = ['creator', 'status', 'winner']

    def get_is_creator(self, obj):
        request = self.context.get('request')
        return request and request.user == obj.creator

    def get_is_opponent(self, obj):
        request = self.context.get('request')
        return request and request.user == obj.opponent

    def get_opponent_choice(self, obj):
        return 'no' if obj.creator_choice == 'yes' else 'yes'

class ChallengeCreateSerializer(serializers.ModelSerializer):
    opponent_username = serializers.CharField(write_only=True)
    creator_choice = serializers.ChoiceField(choices=['yes', 'no'])

    class Meta:
        model = Challenge
        fields = ['opponent_username', 'amount', 'question', 'expires_at', 'creator_choice']

    def validate_opponent_username(self, value):
        try:
            opponent = User.objects.get(username=value)
        except User.DoesNotExist:
            raise serializers.ValidationError("User not found")
        if opponent == self.context['request'].user:
            raise serializers.ValidationError("You cannot challenge yourself")
        return opponent

    def create(self, validated_data):
        opponent = validated_data.pop('opponent_username')
        validated_data['opponent'] = opponent
        validated_data['creator'] = self.context['request'].user
        return Challenge.objects.create(**validated_data)