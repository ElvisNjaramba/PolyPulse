import re
from django.contrib.auth import get_user_model

User = get_user_model()

MENTION_REGEX = r"@([\w.@+-]+)"

def extract_mentions(text):
    return set(re.findall(MENTION_REGEX, text))


def get_mentioned_users(text):
    usernames = extract_mentions(text)
    return User.objects.filter(username__in=usernames)
