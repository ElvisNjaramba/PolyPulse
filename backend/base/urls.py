from django.urls import path
from .views import ChallengeAcceptView, ChallengeCancelView, ChallengeDetailView, ChallengeListCreateView, ChallengeResolveView, CommentLikeToggle,MarketPriceHistoryView, NotificationListView, NotificationReadAllView, AcceptOpenChallengeView, NotificationReadView, PollCancelView, PollCommentView, PollCreateView, PollDetailView, PollListView, PlaceBetView, PollResolveView, PollSuspendView, LeaderboardView, SellSharesView, profile_view, user_positions, PublicChallengeListView, poll_stats, PollCategoryListView

urlpatterns = [
    path("polls/", PollListView.as_view(), name="poll-list"),
    path("polls/create/", PollCreateView.as_view()),
    path("polls/bet/", PlaceBetView.as_view(), name="place-bet"),
    path("polls/<int:id>/", PollDetailView.as_view(), name="poll-detail"),
    path("polls/<int:poll_id>/resolve/", PollResolveView.as_view(), name="poll-resolve"),
    path("polls/<int:poll_id>/suspend/",PollSuspendView.as_view(),name="poll-suspend"),
    path("polls/<int:poll_id>/comments/", PollCommentView.as_view()),
    path("leaderboard/", LeaderboardView.as_view()),
    path("comments/<int:comment_id>/like/", CommentLikeToggle.as_view()),

    path("notifications/", NotificationListView.as_view()),
    path("notifications/<int:id>/read/", NotificationReadView.as_view()),
    path("notifications/read-all/", NotificationReadAllView.as_view()),

    path("polls/<int:poll_id>/sell/", SellSharesView.as_view()),

    path("positions/", user_positions, name="user-positions"),
    path("profile/", profile_view, name="profile-view"),

    path("polls/<int:poll_id>/chart/", MarketPriceHistoryView.as_view()),
    path("categories/", PollCategoryListView.as_view()),
    path("poll-stats/", poll_stats),
    path('polls/<int:poll_id>/cancel/', PollCancelView.as_view(), name='poll-cancel'),

    path('challenges/', ChallengeListCreateView.as_view()),
    path('challenges/<int:pk>/', ChallengeDetailView.as_view()),
    path('challenges/<int:pk>/accept/', ChallengeAcceptView.as_view()),
    path('challenges/<int:pk>/resolve/', ChallengeResolveView.as_view()),
    path('challenges/<int:pk>/cancel/', ChallengeCancelView.as_view()),
    path('challenges/<int:pk>/accept-open/', AcceptOpenChallengeView.as_view()),

    path('challenges/public/', PublicChallengeListView.as_view()),
]
