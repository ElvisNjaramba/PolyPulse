from rest_framework import serializers

from wallet.models import WalletTransaction
from .models import Challenge, MarketPosition, MarketPriceSnapshot, Notification, Poll, PollCategory, PollComment, PollOption, Bet, User
from django.db.models import Sum
from .models import Market
from difflib import SequenceMatcher
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
        try:
            return round(obj.poll.market.price_for_option(obj), 4)
        except Exception:
            return 0.5
    
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
        return round(position.shares_for(obj), 4)

    def get_total_shares(self, obj):
        market = obj.poll.market
        return round(market.shares.get(str(obj.id), 0.0), 4)

    def get_avg_price(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return 0
        position = MarketPosition.objects.filter(
            user=request.user, market=obj.poll.market
        ).first()
        if not position:
            return 0
        return round(position.avg_price_for(obj), 4)

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

        shares = position.shares_for(obj)
        spent = position.spent_for(obj)
        price = market.price_for_option(obj)

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
    creator = serializers.CharField(source='creator.username', read_only=True)

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
            "resolution_criteria",
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
            'creator',  
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
            "resolution_criteria",
            "category",
            "is_free",
            "min_bet",
            "closes_at",
            "options",
        ]

    def validate_options(self, value):
        if len(value) < 2:
            raise serializers.ValidationError("A market must have at least 2 options.")
        if len(value) > 10:
            raise serializers.ValidationError("A market can have at most 10 options.")
        texts = [opt["text"].strip() for opt in value]
        if len(texts) != len(set(t.lower() for t in texts)):
            raise serializers.ValidationError("Duplicate option texts are not allowed.")
        return value

    def validate(self, data):
        title = data.get("title", "").strip().lower()
        open_titles = Poll.objects.filter(
            status="open"
        ).values_list("title", flat=True)

        for existing in open_titles:
            similarity = SequenceMatcher(
                None, title, existing.strip().lower()
            ).ratio()
            if similarity >= 0.8:
                raise serializers.ValidationError(
                    f'A very similar market already exists: "{existing}". '
                    "Consider participating there instead of creating a duplicate."
                )
        return data

    def create(self, validated_data):
        options_data = validated_data.pop("options")
        user = self.context["request"].user
        poll = Poll.objects.create(creator=user, **validated_data)
        for i, option in enumerate(options_data):
            PollOption.objects.create(poll=poll, text=option["text"].strip(), order=i)
        return poll

class PollOptionReadSerializer(serializers.ModelSerializer):
    price = serializers.SerializerMethodField()
    
    class Meta:
        model = PollOption
        fields = ["id", "text", "price"]

    def get_price(self, obj):
        try:
            return round(obj.poll.market.price_for_option(obj), 4)
        except Exception:
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
            "resolution_criteria",
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

        if amount > market.liquidity_b * 2:
            raise serializers.ValidationError(
                "Order too large — split into smaller trades."
            )

        if option.poll_id != poll.id:
            raise serializers.ValidationError("Invalid option for this poll.")

        # ✅ ONE-SIDE RULE: prevent betting on both YES and NO in the same poll
        has_other_position = Bet.objects.filter(
            user=user, poll=poll
        ).exclude(option=option).exists()
        if has_other_position:
            raise serializers.ValidationError(
                "You already have a position on a different option in this market. "
                "Sell your existing shares before switching sides."
            )

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

        return data


class PollOptionDetailSerializer(serializers.ModelSerializer):
    price = serializers.SerializerMethodField()

    class Meta:
        model = PollOption
        fields = ["id", "text", "price"]

    def get_price(self, obj):
        try:
            return round(obj.poll.market.price_for_option(obj), 4)
        except Exception:
            return 0.5

class MarketOptionSerializer(serializers.ModelSerializer):
    price = serializers.SerializerMethodField()
    user_shares = serializers.SerializerMethodField()

    class Meta:
        model = PollOption
        fields = ["id", "text", "price", "user_shares"]

    def get_price(self, obj):
        try:
            return round(obj.poll.market.price_for_option(obj), 4)
        except Exception:
            return 0.5

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

        return round(position.shares_for(obj), 4)


class PollResolveSerializer(serializers.Serializer):
    winning_option_id = serializers.IntegerField()
    criteria_confirmed = serializers.BooleanField(default=False)


    def validate(self, data):
        poll = self.context["poll"]

        if poll.status != "open":
            raise serializers.ValidationError(
                "Only open polls can be resolved."
            )
        if poll.resolution_criteria:
            confirmed = self.initial_data.get("criteria_confirmed", False)
            if not confirmed:
                raise serializers.ValidationError(
                    "You must confirm that all resolution criteria have been met."
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
    creator_choice_display = serializers.CharField(source='creator_choice', read_only=True)
    opponent_choice = serializers.SerializerMethodField()

    class Meta:
        model = Challenge
        fields = [
            'id', 'creator', 'creator_username', 'opponent', 'opponent_username',
            'amount', 'question', 'status', 'expires_at', 'resolution_criteria','winner', 'created_at',
            'is_creator', 'is_opponent', 'creator_choice', 'creator_choice_display',
            'opponent_choice', 'is_open', 'poll',
        ]
        read_only_fields = ['creator', 'status', 'winner']

    def get_is_creator(self, obj):
        request = self.context.get('request')
        return request and request.user == obj.creator

    def get_is_opponent(self, obj):
        request = self.context.get('request')
        return request and request.user == obj.opponent

    def get_opponent_choice(self, obj):
        options = list(obj.poll.options.values_list("text", flat=True)) if obj.poll else []
        if len(options) == 2:
            return next((o for o in options if o.lower() != obj.creator_choice.lower()), None)
        return None


class ChallengeCreateSerializer(serializers.ModelSerializer):
    opponent_username = serializers.CharField(
        write_only=True, required=False, allow_blank=True, default=""
    )
    creator_choice = serializers.CharField(max_length=255)

    class Meta:
        model = Challenge
        fields = ['opponent_username', 'resolution_criteria', 'amount', 'question', 'expires_at', 
                  'creator_choice', 'is_open', 'poll']

    def validate(self, data):
        is_open = data.get('is_open', False)
        opponent = data.get('opponent_username')  

        if not is_open and not opponent:
            raise serializers.ValidationError(
                "Provide an opponent username or create an open challenge."
            )
        if is_open and opponent:
            raise serializers.ValidationError(
                "Open challenges cannot have a specific opponent."
            )
        return data

    def validate_opponent_username(self, value):
        if not value or not value.strip():
            return None   # ✅ return None, not empty string
        try:
            opponent = User.objects.get(username=value.strip())
        except User.DoesNotExist:
            raise serializers.ValidationError("User not found")
        if opponent == self.context['request'].user:
            raise serializers.ValidationError("You cannot challenge yourself")
        return opponent  # returns User object

    def create(self, validated_data):
        opponent = validated_data.pop('opponent_username', None)  # User obj or None
        validated_data['creator'] = self.context['request'].user
        if opponent is not None:
            validated_data['opponent'] = opponent
        # For open challenges, opponent stays null — model now allows it ✅
        return Challenge.objects.create(**validated_data)
