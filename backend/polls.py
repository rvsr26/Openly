"""
polls.py  –  Quick-poll logic for Openly.

Each post can optionally have an embedded 'poll' sub-document:
{
  "question": "Should I switch from React to Next.js?",
  "type": "yesno" | "multiple",
  "options": [
    {"id": "opt_0", "text": "Yes", "votes": 0},
    {"id": "opt_1", "text": "No",  "votes": 0}
  ],
  "total_votes": 0,
  "allow_anonymous": true,
  "ends_at": None,
  "votes": {uid: opt_id, ...}   # hidden from client
}
"""

from datetime import datetime, timezone
from time_utils import get_now, get_now_iso
from typing import Optional, List
from pydantic import BaseModel
from bson import ObjectId
from database import posts_collection


# ─────────────────────────────────────────────
#  MODELS
# ─────────────────────────────────────────────

class PollOptionIn(BaseModel):
    text: str

class PollCreate(BaseModel):
    question: str
    type: str = "multiple"           # "yesno" | "multiple"
    options: Optional[List[PollOptionIn]] = None   # ignored for yesno
    allow_anonymous: bool = True
    ends_at: Optional[str] = None


# ─────────────────────────────────────────────
#  BUILD POLL DOC (called at post creation)
# ─────────────────────────────────────────────

def build_poll_doc(poll: PollCreate) -> dict:
    """
    Returns the poll sub-document to embed in the post.
    """
    if poll.type == "yesno":
        options = [
            {"id": "opt_0", "text": "Yes", "votes": 0},
            {"id": "opt_1", "text": "No",  "votes": 0},
        ]
    else:
        # Multiple choice: at least 2 options required
        if not poll.options or len(poll.options) < 2:
            raise ValueError("Multiple-choice polls require at least 2 options.")
        options = [
            {"id": f"opt_{i}", "text": opt.text.strip(), "votes": 0}
            for i, opt in enumerate(poll.options[:6])   # max 6
        ]

    return {
        "question":        poll.question.strip(),
        "type":            poll.type,
        "options":         options,
        "total_votes":     0,
        "allow_anonymous": poll.allow_anonymous,
        "ends_at":         poll.ends_at,
        "votes":           {},     # {user_id: opt_id}
    }


# ─────────────────────────────────────────────
#  VOTE
# ─────────────────────────────────────────────

async def cast_vote(post_id: str, option_id: str, voter_id: str) -> dict:
    """
    Records a vote (or changes an existing vote) and returns the updated poll.
    """
    post = await posts_collection.find_one({"_id": ObjectId(post_id)})
    if not post:
        raise ValueError("Post not found.")
    
    poll = post.get("poll")
    if not poll:
        raise ValueError("This post does not have a poll.")

    # Check expiry
    if poll.get("ends_at"):
        try:
            ends = datetime.fromisoformat(poll["ends_at"])
            if get_now() > ends:
                raise ValueError("This poll has ended.")
        except ValueError as ve:
            if "ended" in str(ve):
                raise

    # Validate option
    valid_ids = {o["id"] for o in poll["options"]}
    if option_id not in valid_ids:
        raise ValueError(f"Invalid option '{option_id}'.")

    votes: dict = poll.get("votes", {})
    previous_vote = votes.get(voter_id)

    # Build update operations
    update: dict = {}

    if previous_vote == option_id:
        # Clicking same option = retract vote
        update = {
            "$inc": {
                f"poll.votes_by_option.{option_id}": -1,   # not used, we recalc
                "poll.total_votes": -1,
            },
            "$unset": {f"poll.votes.{voter_id}": ""},
        }
        # Decrement the option's vote count
        await posts_collection.update_one(
            {"_id": ObjectId(post_id)},
            {
                "$inc": {"poll.total_votes": -1},
                "$unset": {f"poll.votes.{voter_id}": ""},
            }
        )
        # Decrement individual option counter in array
        await posts_collection.update_one(
            {"_id": ObjectId(post_id), "poll.options.id": previous_vote},
            {"$inc": {"poll.options.$.votes": -1}}
        )
    else:
        # Switch from previous (if any) and set new
        if previous_vote:
            await posts_collection.update_one(
                {"_id": ObjectId(post_id), "poll.options.id": previous_vote},
                {"$inc": {"poll.options.$.votes": -1}}
            )
        else:
            # Brand-new vote
            await posts_collection.update_one(
                {"_id": ObjectId(post_id)},
                {"$inc": {"poll.total_votes": 1}}
            )

        await posts_collection.update_one(
            {"_id": ObjectId(post_id), "poll.options.id": option_id},
            {
                "$inc": {f"poll.options.$.votes": 1},
                "$set": {f"poll.votes.{voter_id}": option_id},
            }
        )

    # Return fresh poll data (without the votes map — privacy)
    fresh = await posts_collection.find_one({"_id": ObjectId(post_id)})
    fresh_poll = fresh["poll"]
    voter_choice = fresh_poll.get("votes", {}).get(voter_id)
    return {
        "question":        fresh_poll["question"],
        "type":            fresh_poll["type"],
        "options":         fresh_poll["options"],
        "total_votes":     fresh_poll["total_votes"],
        "allow_anonymous": fresh_poll["allow_anonymous"],
        "ends_at":         fresh_poll.get("ends_at"),
        "voted_option_id": voter_choice,
    }


async def get_poll(post_id: str, voter_id: Optional[str] = None) -> Optional[dict]:
    """
    Return poll data for a post, optionally annotated with voter's choice.
    """
    post = await posts_collection.find_one({"_id": ObjectId(post_id)})
    if not post or "poll" not in post:
        return None
    
    p = post["poll"]
    voter_choice = p.get("votes", {}).get(voter_id) if voter_id else None
    return {
        "question":        p["question"],
        "type":            p["type"],
        "options":         p["options"],
        "total_votes":     p["total_votes"],
        "allow_anonymous": p["allow_anonymous"],
        "ends_at":         p.get("ends_at"),
        "voted_option_id": voter_choice,
    }
