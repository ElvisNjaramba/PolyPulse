from rest_framework import serializers
from .models import Notification, Poll, PollComment, PollOption, Bet
from django.db.models import Sum

class PollOptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = PollOption
        fields = ["text"]


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
        if len(value) < 2:
            raise serializers.ValidationError("At least two options are required.")
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
    total_bet = serializers.SerializerMethodField()

    class Meta:
        model = PollOption
        fields = ["id", "text", "total_bet"]

    def get_total_bet(self, obj):
        total = obj.bets.aggregate(total=Sum("amount"))["total"]
        return total or 0


class PollDetailSerializer(serializers.ModelSerializer):
    creator = serializers.StringRelatedField()
    category = serializers.StringRelatedField()
    options = PollOptionDetailSerializer(many=True)

    total_pool = serializers.SerializerMethodField()
    user_bet = serializers.SerializerMethodField()
    can_accept_bets = serializers.SerializerMethodField()
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
            "closes_at",
            "created_at",
            "status",
            "can_accept_bets",
            "options",
            "total_pool",
            "user_bet",
        ]

    def get_total_pool(self, obj):
        total = obj.bets.aggregate(total=Sum("amount"))["total"]
        return total or 0

    def get_user_bet(self, obj):
        request = self.context.get("request")

        if not request or not request.user.is_authenticated:
            return None

        bet = Bet.objects.filter(
            poll=obj,
            user=request.user
        ).select_related("option").first()

        if not bet:
            return None

        return {
            "option_id": bet.option.id,
            "option_text": bet.option.text,
            "amount": bet.amount,
        }

    def get_can_accept_bets(self, obj):
        return obj.can_accept_bets()

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
