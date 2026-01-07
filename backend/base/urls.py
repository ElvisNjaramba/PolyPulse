from django.urls import path
from .views import CommentLikeToggle, NotificationListView, NotificationReadAllView, NotificationReadView, PollCommentView, PollCreateView, PollDetailView, PollListView, PlaceBetView, PollResolveView, PollSuspendView, LeaderboardView

urlpatterns = [
    path("polls/", PollListView.as_view(), name="poll-list"),
    path("polls/create/", PollCreateView.as_view(), name="poll-create"),
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


]
