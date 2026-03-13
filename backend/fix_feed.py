
import os
import re

def fix_get_feed():
    path = r"d:\PROJECTS\Openly\backend\main.py"
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    
    # Define the new get_feed function content
    new_function = '''@app.get("/feed/")
async def get_feed(request: Request, category: Optional[str] = None, sort_by: str = "new", user_id: Optional[str] = None):
    # Check cache first (skip for personalized "for-you" feed)
    if sort_by != "for-you":
        cache_key = generate_cache_key(sort_by, category or "All", user_id)
        cached_feed = await get_cached_feed(cache_key)
        if cached_feed:
            return cached_feed
    
    query = {"is_rejected": False, "is_archived": False}

    # Restrict Hub Visibility
    followed_hubs = []
    if user_id:
        user = await get_user_by_any_id(user_id)
        if user:
            followed_hubs = user.get("followed_hubs", [])
            
    query["$or"] = [
        {"hubs": {"$in": followed_hubs}},
        {"hubs": {"$size": 0}},
        {"hubs": {"$exists": False}},
        {"hubs": None}
    ]
    if category and category != "All":
        query["category"] = category
        
    feed = []
    
    if sort_by == "for-you" and user_id:
        # Collaborative Filtering Algorithm:
        # 1. Find posts liked by the current user
        user_likes_cursor = reactions_collection.find({"user_id": user_id})
        user_liked_post_ids = [doc["post_id"] async for doc in user_likes_cursor]

        if not user_liked_post_ids:
            # Fallback to Hot if user hasn't liked anything
            sort_by = "hot"
        else:
            # 2. Find other users who liked the same posts
            # 3. Find posts liked by those similar users (excluding current user's likes)
            pipeline = [
                {"$match": {"post_id": {"$in": user_liked_post_ids}, "user_id": {"$ne": user_id}}},
                {"$group": {"_id": "$user_id", "overlap_count": {"$sum": 1}}},
                {"$sort": {"overlap_count": -1}},
                {"$limit": 50}, # Top 50 similar users
                {"$lookup": {
                    "from": "reactions",
                    "localField": "_id",
                    "foreignField": "user_id",
                    "as": "similar_user_likes"
                }},
                {"$unwind": "$similar_user_likes"},
                {"$match": {"similar_user_likes.post_id": {"$nin": user_liked_post_ids}}},
                {"$group": {
                    "_id": "$similar_user_likes.post_id",
                    "recommendation_score": {"$sum": 1}
                }},
                {"$sort": {"recommendation_score": -1}},
                {"$limit": 20}
            ]
            
            reco_cursor = reactions_collection.aggregate(pipeline)
            reco_post_ids = [ObjectId(doc["_id"]) async for doc in reco_cursor if ObjectId.is_valid(doc["_id"])]
            
            if not reco_post_ids:
                # Fallback to general Trending
                sort_by = "hot"
            else:
                # Fetch specifically these posts and maintain order
                posts_query = {"_id": {"$in": reco_post_ids}, "is_rejected": False, "is_archived": False}
                if category and category != "All":
                    posts_query["category"] = category
                
                cursor = posts_collection.find(posts_query)
                # Map to maintain order
                posts_map = {str(doc["_id"]): doc for doc in [d async for d in cursor]}
                feed_data = [posts_map[str(pid)] for pid in reco_post_ids if str(pid) in posts_map]
                
                if not feed_data:
                    sort_by = "hot"
                else:
                    return [serialize_doc(d, requester_id=user_id) for d in feed_data] # Return early for for-you success

    if sort_by == "top":
        # Wilson Score Interval (Top Rated) Algorithm
        z = 1.96
        z2 = z * z
        pipeline = [
            {"$match": query},
            {
                "$addFields": {
                    "n": {"$add": ["$reaction_count", {"$ifNull": ["$report_count", 0]}]}
                }
            },
            {
                "$addFields": {
                    "top_score": {
                        "$cond": {
                            "if": {"$gt": ["$n", 0]},
                            "then": {
                                "$let": {
                                    "vars": {
                                        "p": {"$divide": ["$reaction_count", "$n"]}
                                    },
                                    "in": {
                                        "$divide": [
                                            {"$subtract": [
                                                {"$add": ["$$p", {"$divide": [z2, {"$multiply": [2, "$n"]}]}]},
                                                {"$multiply": [
                                                    z,
                                                    {"$sqrt": {"$add": [
                                                        {"$divide": [{"$multiply": ["$$p", {"$subtract": [1, "$$p"]}]}, "$n"]},
                                                        {"$divide": [z2, {"$multiply": [4, {"$pow": ["$n", 2]}]}]}
                                                    ]}}
                                                ]}
                                            ]},
                                            {"$add": [1, {"$divide": [z2, "$n"]}]}
                                        ]
                                    }
                                }
                            },
                            "else": 0
                        }
                    }
                }
            },
            {"$sort": {"top_score": -1, "created_at": -1}},
            {"$limit": 100}
        ]
        cursor = posts_collection.aggregate(pipeline)
    elif sort_by == "hot":
        # Hot Algorithm: Score = Log10(max(reactions, 1)) + (timestamp / 100000000)
        pipeline = [
            {"$match": query},
            {
                "$addFields": {
                    "ts": {
                        "$cond": {
                            "if": {"$eq": [{"$type": "$created_at"}, "date"]},
                            "then": {"$toLong": "$created_at"},
                            "else": {"$toLong": {"$dateFromString": {"dateString": {"$ifNull": ["$created_at", "2024-01-01T00:00:00Z"]}}}}
                        }
                    }
                }
            },
            {
                "$addFields": {
                    "hot_score": {
                        "$add": [
                            {"$log10": {"$max": [{"$ifNull": ["$reaction_count", 0]}, 1]}},
                            {"$divide": ["$ts", 100000000]} 
                        ]
                    }
                }
            },
            {"$sort": {"hot_score": -1}},
            {"$limit": 100}
        ]
        cursor = posts_collection.aggregate(pipeline)
    else:
        # Default: Newest first
        cursor = posts_collection.find(query).sort("created_at", -1).limit(100)

    async for doc in cursor:
        data = serialize_doc(doc, requester_id=user_id)
        
        # [PROFILES] DYNAMIC PROFILE UPDATE
        if not data.get("is_anonymous", False) and data.get("user_id"):
            user_info = await users_collection.find_one({"_id": data["user_id"]})
            if user_info:
                data["user_name"] = user_info.get("display_name") or user_info.get("username") or data["user_name"]
                data["user_pic"] = user_info.get("photoURL") or data["user_pic"]
                data["username"] = "@" + user_info.get("username", "user")

        # [PRIVACY] PRIVACY SHIELD
        if data.get("is_anonymous", False):
            data["user_id"] = None
            data["user_pic"] = "/assets/ghost_avatar.png"
            data["username"] = "@ghost"
            data["user_name"] = "Anonymous"
        
        feed.append(data)
    
    # Cache the feed (with appropriate TTL based on sort type)
    if sort_by != "for-you":
        cache_key = generate_cache_key(sort_by, category or "All", user_id)
        ttl = 15 if sort_by == "new" else 30  # New feeds are more volatile
        await set_cached_feed(cache_key, feed, ttl)
        
    return feed'''

    # Use regex to replace the function entirely
    pattern = r'@app\.get\("/feed/"\)\s+async def get_feed\(.*?\):.*?return feed'
    new_content = re.sub(pattern, new_function, content, flags=re.DOTALL)
    
    if new_content != content:
        with open(path, "w", encoding="utf-8") as f:
            f.write(new_content)
        print("Successfully updated get_feed function.")
    else:
        print("Function pattern not found. Check function body ending.")

if __name__ == "__main__":
    fix_get_feed()
