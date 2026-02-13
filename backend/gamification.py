
from typing import List, Dict

# Score Constants
SCORE_POST_CREATION = 10
SCORE_COMMENT = 2
SCORE_RECEIVE_UPVOTE = 1
SCORE_RECEIVE_HELPFUL = 5
SCORE_COLLABORATION = 15

# Badge Definitions
BADGES = {
    "RISING_PHOENIX": {"threshold": 50, "label": "Rising Phoenix", "icon": "🔥"},
    "COMMUNITY_MENTOR": {"threshold": 200, "label": "Community Mentor", "icon": "🛡️"},
    "VETERAN_GUIDE": {"threshold": 500, "label": "Veteran Guide", "icon": "🌟"},
    "RESILIENCE_MASTER": {"threshold": 1000, "label": "Resilience Master", "icon": "👑"}
}

def calculate_score_action(action_type: str) -> int:
    """Returns the score value for a specific action."""
    if action_type == "post_creation":
        return SCORE_POST_CREATION
    elif action_type == "comment":
        return SCORE_COMMENT
    elif action_type == "receive_upvote":
        return SCORE_RECEIVE_UPVOTE
    elif action_type == "receive_helpful":
        return SCORE_RECEIVE_HELPFUL
    elif action_type == "collaboration":
        return SCORE_COLLABORATION
    return 0

def get_badges_for_score(score: int) -> List[str]:
    """Returns a list of badge IDs that the user qualifies for."""
    earned_badges = []
    for badge_id, data in BADGES.items():
        if score >= data["threshold"]:
            earned_badges.append(badge_id)
    return earned_badges

def get_badge_details(badge_id: str) -> Dict:
    """Returns details for a specific badge."""
    return BADGES.get(badge_id, {})
