from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone, timedelta
from database import (
    posts_collection, reactions_collection, comments_collection, 
    follows_collection, user_activity_collection, users_collection
)
from bson import ObjectId

router = APIRouter(prefix="/api/reports", tags=["Reports"])

class HeartbeatRequest(BaseModel):
    user_id: str

@router.post("/heartbeat")
async def record_heartbeat(req: HeartbeatRequest):
    """
    Records a minute of activity for the user.
    Should be called every minute by the frontend while the tab is active.
    """
    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    
    # Upsert: If doc exists for (user_id, date), increment minutes.
    # If not, create it.
    await user_activity_collection.update_one(
        {"user_id": req.user_id, "date": today_str},
        {
            "$inc": {"minutes_active": 1},
            "$set": {"last_active": datetime.now(timezone.utc).isoformat()}
        },
        upsert=True
    )
    return {"status": "ok"}

@router.get("/stats")
async def get_report_stats(user_id: str, range: str = "all_time"):
    """
    Aggregates stats for the user:
    - Time Usage (from user_activity)
    - Interactions Received (Likes/Comments on their posts)
    - Interactions Made (Likes/Comments they gave)
    - Posts Created
    """
    
    # 1. Time Usage
    # Calculate totals from user_activity
    activity_cursor = user_activity_collection.find({"user_id": user_id})
    total_minutes = 0
    async for doc in activity_cursor:
        total_minutes += doc.get("minutes_active", 0)
        
    # 2. Posts Created
    post_count = await posts_collection.count_documents({
        "user_id": user_id, 
        "is_rejected": False, 
        "is_archived": False
    })
    
    # 3. Interactions MADE (by user)
    # Likes given
    likes_given = await reactions_collection.count_documents({"user_id": user_id})
    # Comments given
    comments_given = await comments_collection.count_documents({"user_id": user_id})
    # Follows given
    following_count = await follows_collection.count_documents({"follower_id": user_id})
    
    # 4. Interactions RECEIVED (to user's content)
    # We need to find all posts by user first to count reactions/comments on them
    # This might be heavy for huge datasets, but for now it's fine.
    # Optimization: Use aggregation pipeline
    
    # Pipeline to count likes on user's posts
    likes_received_pipeline = [
        {"$match": {"user_id": user_id}}, # Find user's posts
        {"$lookup": {
            "from": "reactions",
            "localField": "_id", # Post ID
            "foreignField": "post_id",
            "as": "reactions"
        }},
        {"$project": {"count": {"$size": "$reactions"}}},
        {"$group": {"_id": None, "total": {"$sum": "$count"}}}
    ]
    likes_rx_result = await posts_collection.aggregate(likes_received_pipeline).to_list(1)
    likes_received = likes_rx_result[0]["total"] if likes_rx_result else 0

    # Pipeline to count comments on user's posts
    comments_received_pipeline = [
        {"$match": {"user_id": user_id}}, 
        {"$lookup": {
            "from": "comments",
            "localField": "_id",
            "foreignField": "post_id",
            "as": "comments"
        }},
        {"$project": {"count": {"$size": "$comments"}}},
        {"$group": {"_id": None, "total": {"$sum": "$count"}}}
    ]
    comments_rx_result = await posts_collection.aggregate(comments_received_pipeline).to_list(1)
    comments_received = comments_rx_result[0]["total"] if comments_rx_result else 0
    
    # Followers
    followers_count = await follows_collection.count_documents({"following_id": user_id})

    return {
        "time_usage": {
            "total_minutes": total_minutes,
            "total_hours": round(total_minutes / 60, 1)
        },
        "interactions": {
            "made": {
                "likes": likes_given,
                "comments": comments_given,
                "following": following_count
            },
            "received": {
                "likes": likes_received,
                "comments": comments_received,
                "followers": followers_count
            }
        },
        "posts": {
            "total": post_count
        }
    }
