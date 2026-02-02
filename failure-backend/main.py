import os
from fastapi import FastAPI, HTTPException, Query, File, UploadFile, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import shutil
from dotenv import load_dotenv
from ai_utils import is_toxic, extract_keywords
from database import posts_collection, users_collection, comments_collection, reactions_collection, bookmarks_collection, reports_collection
from bson import ObjectId

# --- 1. SETUP ---
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- STATIC FILES ---
UPLOAD_DIR = "uploads"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# --- 2. MODELS ---

class PostRequest(BaseModel):
    user_id: str
    user_name: str
    user_pic: Optional[str] = None
    content: str
    category: Optional[str] = "All"
    image_url: Optional[str] = None
    is_anonymous: bool = False
    tags: List[str] = [] 

class ViewRequest(BaseModel):
    user_id: str

class CommentRequest(BaseModel):
    content: str
    user_id: str
    user_name: str
    user_pic: Optional[str] = None

class UsernameRequest(BaseModel):
    user_id: str
    username: str

class ReportRequest(BaseModel):
    reporter_id: str
    target_id: str
    target_type: str  # 'post' or 'user'
    reason: str
    details: Optional[str] = None

# --- 3. HELPER FUNCTIONS ---

def serialize_doc(doc):
    if not doc: return None
    doc["id"] = str(doc["_id"])
    del doc["_id"]
    return doc

def classify_category(content: str):
    text = content.lower()
    if any(w in text for w in ["job", "work", "interview", "resume", "boss", "salary"]):
        return "Career"
    if any(w in text for w in ["startup", "business", "founder", "money", "fund"]):
        return "Startup"
    if any(w in text for w in ["exam", "grade", "college", "gpa", "study"]):
        return "Academic"
    if any(w in text for w in ["breakup", "divorce", "dating", "love", "lonely"]):
        return "Relationship"
    if any(w in text for w in ["health", "sick", "doctor", "hospital", "pain"]):
        return "Health"
    return "Life"

# --- 4. CORE ROUTES ---

@app.get("/")
def read_root():
    return {"message": "Openly Backend is LIVE (MongoDB)"}

# --- POSTS ---

@app.post("/posts/")
async def create_post(post: PostRequest):
    if is_toxic(post.content):
        # Log rejected post
        await posts_collection.insert_one({
            "user_id": post.user_id,
            "content": post.content,
            "is_rejected": True,
            "created_at": datetime.utcnow().isoformat()
        })
        return {"status": "rejected_for_toxicity"}

    # Fetch Username for handle (User docs use user_id as _id)
    user_doc = await users_collection.find_one({"_id": post.user_id})
    username = "@anonymous"

    if user_doc:
        username = "@" + user_doc.get("username", "anonymous")

    # Auto-tagging if no tags provided
    if not post.tags:
        extracted = extract_keywords(post.content)
        if extracted:
            post.tags = extracted

    new_post = {
        "user_id": post.user_id,
        "user_name": "Anonymous" if post.is_anonymous else post.user_name,
        "user_pic": None if post.is_anonymous else post.user_pic,
        "username": "@anonymous" if post.is_anonymous else username,
        "content": post.content,
        "category": post.category if post.category and post.category != "All" else classify_category(post.content),
        "tags": post.tags,
        "image_url": post.image_url,
        "created_at": datetime.utcnow().isoformat(),
        "is_anonymous": post.is_anonymous,
        "view_count": 0,
        "reaction_count": 0,
        "report_count": 0,
        "is_rejected": False
    }
    
    result = await posts_collection.insert_one(new_post)
    return {"id": str(result.inserted_id), "status": "posted"}

@app.get("/feed/")
async def get_feed(request: Request, category: Optional[str] = None, sort_by: str = "new", user_id: Optional[str] = None):
    query = {"is_rejected": False}

    if category and category != "All":
        query["category"] = category
        
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
                sort_by = "hot"
            else:
                # Fetch actual posts, maintaining order from reco_post_ids
                posts_query = {"_id": {"$in": reco_post_ids}, "is_rejected": False}
                if category and category != "All":
                    posts_query["category"] = category
                
                cursor = posts_collection.find(posts_query)
                # Map to maintain order
                posts_map = {str(doc["_id"]): doc for doc in [d async for d in cursor]}
                feed_data = [posts_map[str(pid)] for pid in reco_post_ids if str(pid) in posts_map]
                
                # If we don't have enough recommendations, supplement with Hot
                if len(feed_data) < 5:
                    # Supplement logic... for now just use what we have or fallback if empty
                    pass
                
                if not feed_data:
                    sort_by = "hot"
                else:
                    return [serialize_doc(d) for d in feed_data] # Return early for for-you success

    if sort_by == "top":
        # Wilson Score Interval (Top Rated) Algorithm
        # n = reaction_count + report_count (ignore posts with 0 reactions/reports)
        # p_hat = reaction_count / n
        # z = 1.96 (95% confidence)
        z = 1.96
        z2 = z * z
        pipeline = [
            {"$match": query},
            # Filter out posts with no signals to avoid division by zero or nonsensical scores
            # Or just default them to 0. Let's use 0.
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
        # Hot Algorithm: Score = Log10(max(reactions, 1)) + (timestamp / 45000)
        # Decay factor 45000s ≈ 12.5h. 
        # ts is in ms from $toLong, so divide by 45,000,000 to get the same scale in seconds.
        pipeline = [
            {"$match": query},
            {
                "$addFields": {
                    "ts": {"$toLong": {"$dateFromString": {"dateString": "$created_at"}}}
                }
            },
            {
                "$addFields": {
                    "hot_score": {
                        "$add": [
                            {"$log10": {"$max": ["$reaction_count", 1]}},
                            {"$divide": ["$ts", 45000000]} 
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

    feed = []
    
    async for doc in cursor:
        data = serialize_doc(doc)
        
        # 🛠️ DYNAMIC PROFILE UPDATE
        if not data.get("is_anonymous", False) and data.get("user_id"):
            user_info = await users_collection.find_one({"_id": data["user_id"]})
            if user_info:
                data["user_name"] = user_info.get("display_name") or user_info.get("username") or data["user_name"]
                data["user_pic"] = user_info.get("photoURL") or data["user_pic"]
                data["username"] = "@" + user_info.get("username", "user")

        # 🛡️ PRIVACY SHIELD
        if data.get("is_anonymous", False):
            data["user_id"] = None
            data["user_pic"] = "/assets/ghost_avatar.png"
            data["username"] = "@ghost"
            data["user_name"] = "Anonymous"
        
        feed.append(data)
        
    return feed

@app.get("/posts/{post_id}")
async def get_post(post_id: str):
    try:
        oid = ObjectId(post_id)
    except:
        raise HTTPException(404, "Post not found")

    doc = await posts_collection.find_one({"_id": oid})
    if not doc:
        raise HTTPException(404, "Post not found")
    return serialize_doc(doc)

@app.delete("/posts/{post_id}")
async def delete_post(post_id: str, user_id: str):
    try:
        oid = ObjectId(post_id)
    except:
        raise HTTPException(404, "Post not found")

    post = await posts_collection.find_one({"_id": oid})
    
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
        
    if post.get("user_id") != user_id:
        raise HTTPException(status_code=403, detail="Permission denied")
        
    await posts_collection.delete_one({"_id": oid})
    # Optional: Delete comments and reactions? For now keeping it simple.
    return {"status": "deleted"}

# --- REPORTS ---

@app.post("/reports/")
async def create_report(report: ReportRequest):
    new_report = {
        "reporter_id": report.reporter_id,
        "target_id": report.target_id,
        "target_type": report.target_type,
        "reason": report.reason,
        "details": report.details,
        "created_at": datetime.utcnow().isoformat(),
        "status": "pending"
    }
    result = await reports_collection.insert_one(new_report)

    # Increment report_count on target if it's a post
    if report.target_type == "post":
        try:
            from bson import ObjectId
            target_oid = ObjectId(report.target_id)
            await posts_collection.update_one(
                {"_id": target_oid},
                {"$inc": {"report_count": 1}}
            )
        except Exception as e:
            print(f"Error incrementing report_count: {e}")

    return {"id": str(result.inserted_id), "status": "reported"}

# --- SEARCH ---

@app.get("/search/")
async def search_mixed(q: str = Query(..., min_length=3)):
    q_str = q.lower()
    regex = {"$regex": q_str, "$options": "i"} # options i = case insensitive

    results = []

    # 1. SEARCH USERS
    # Find users where username matches
    user_cursor = users_collection.find({"username": regex})
    async for doc in user_cursor:
        data = serialize_doc(doc)
        # user_id is the _id
        results.append({
            "type": "user",
            "id": data["id"], 
            "username": data.get("username"),
            "user_pic": data.get("photoURL"), 
            "display_name": data.get("display_name"),
        })

    # 2. SEARCH POSTS
    # Search in content, tags, category, username
    post_query = {
        "is_rejected": False,
        "$or": [
            {"content": regex},
            {"tags": regex},
            {"category": regex},
            {"username": regex}
        ]
    }
    
    post_cursor = posts_collection.find(post_query)
    async for doc in post_cursor:
        data = serialize_doc(doc)
        
        # 🛠️ DYNAMIC PROFILE UPDATE
        if not data.get("is_anonymous", False) and data.get("user_id"):
            u_info = await users_collection.find_one({"_id": data["user_id"]})
            if u_info:
                data["user_name"] = u_info.get("display_name") or u_info.get("username") or data["user_name"]
                data["user_pic"] = u_info.get("photoURL") or data["user_pic"]
                data["username"] = "@" + u_info.get("username", "user")

        author_handle = data.get("username", "").lower()

        # Privacy Shield
        if data.get("is_anonymous", False):
            data["user_id"] = None
            data["user_pic"] = "/assets/ghost_avatar.png"
            data["username"] = "@ghost"
            # If searching for a specific person, don't show their anonymous posts
            if q_str in author_handle: 
                continue 
        
        results.append({
            "type": "post",
            **data
        })
            
    return results

# --- PROFILE ---

@app.get("/users/{user_id}/profile")
async def get_user_profile(user_id: str):
    # Fetch user data (user_id is _id)
    user_doc = await users_collection.find_one({"_id": user_id})
    user_data = user_doc if user_doc else {}

    # Fetch posts
    cursor = posts_collection.find({"user_id": user_id}).sort("created_at", -1)
    
    user_posts = []
    total_views = 0
    total_posts = 0
    
    async for doc in cursor:
        data = serialize_doc(doc)
        
        # 🛠️ DYNAMIC PROFILE UPDATE (Keep it fresh)
        if not data.get("is_anonymous", False):
            data["user_name"] = user_data.get("display_name") or user_data.get("username") or data["user_name"]
            data["user_pic"] = user_data.get("photoURL") or data["user_pic"]
            data["username"] = "@" + user_data.get("username", "user")

        total_views += data.get("view_count", 0)
        total_posts += 1
        user_posts.append(data)
    
    reputation = (total_posts * 10) + total_views

    return {
        "user_info": {
            "id": str(user_data.get("_id")),
            "username": user_data.get("username", None),
            "display_name": user_data.get("display_name", "Anonymous"),
            "photoURL": user_data.get("photoURL", None),
            "headline": user_data.get("headline", None),
            "bio": user_data.get("bio", None),
            "website": user_data.get("website", None),
            "location": user_data.get("location", None)
        },
        "stats": {
            "reputation": reputation,
            "total_views": total_views,
            "total_posts": total_posts
        },
        "posts": user_posts
    }

@app.post("/users/profile/photo")
async def upload_profile_photo(user_id: str, request: Request, file: UploadFile = File(...)):
    # Validate file type
    if not file.content_type.startswith("image/"):
        raise HTTPException(400, "Only images allowed")

    # Ensure user exists
    user = await users_collection.find_one({"_id": user_id})
    if not user:
        raise HTTPException(404, "User not found")

    # Define path
    ext = file.filename.split(".")[-1]
    filename = f"{user_id}_{int(datetime.utcnow().timestamp())}.{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)

    # Save file
    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Update DB - Use relative path for robustness across environments
    photo_url = f"/uploads/{filename}"
    await users_collection.update_one(
        {"_id": user_id},
        {"$set": {"photoURL": photo_url}}
    )

    return {"status": "success", "photoURL": photo_url}

@app.get("/users/username/{username}")
async def public_profile(username: str):
    user = await users_collection.find_one({"username": username})
    if not user:
        raise HTTPException(404, "User not found")
    return await get_user_profile(user["_id"]) # _id is the firebase uid

@app.post("/users/set-username")
async def set_username(req: UsernameRequest):
    username = req.username.strip().lower()
    
    if len(username) < 3 or " " in username:
        raise HTTPException(status_code=400, detail="Invalid username format")

    # Check existence
    existing = await users_collection.find_one({"username": username})
    
    if existing and existing["_id"] != req.user_id:
        raise HTTPException(status_code=409, detail="Username taken")

    # Upsert user document
    await users_collection.update_one(
        {"_id": req.user_id},
        {"$set": {
            "username": username, 
            "updated_at": datetime.utcnow().isoformat()
        }},
        upsert=True
    )

    return {"status": "success", "username": username}

class ProfileUpdateRequest(BaseModel):
    user_id: str
    headline: Optional[str] = None
    bio: Optional[str] = None
    website: Optional[str] = None
    location: Optional[str] = None

@app.post("/users/profile/update")
async def update_profile(req: ProfileUpdateRequest):
    update_data = {}
    if req.headline is not None: update_data["headline"] = req.headline
    if req.bio is not None: update_data["bio"] = req.bio
    if req.website is not None: update_data["website"] = req.website
    if req.location is not None: update_data["location"] = req.location
    
    if not update_data:
        return {"status": "no_changes"}

    update_data["updated_at"] = datetime.utcnow().isoformat()
    
    result = await users_collection.update_one(
        {"_id": req.user_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(404, "User not found")
        
    return {"status": "updated"}

# --- INTERACTIONS ---

@app.post("/posts/{post_id}/view")
async def increment_view(post_id: str, req: ViewRequest):
    try:
        oid = ObjectId(post_id)
    except:
        return {"status": "error", "message": "invalid_id"}

    await posts_collection.update_one(
        {"_id": oid},
        {"$inc": {"view_count": 1}}
    )
    return {"status": "view_counted"}

@app.post("/posts/{post_id}/react")
async def toggle_reaction(post_id: str, req: ViewRequest):
    try:
        oid = ObjectId(post_id)
    except:
        raise HTTPException(404, "Post not found")

    # Check if reaction exists
    reaction = await reactions_collection.find_one({
        "post_id": post_id,
        "user_id": req.user_id
    })

    if reaction:
        # Remove
        await reactions_collection.delete_one({"_id": reaction["_id"]})
        await posts_collection.update_one({"_id": oid}, {"$inc": {"reaction_count": -1}})
        status = "removed"
    else:
        # Add
        await reactions_collection.insert_one({
            "post_id": post_id,
            "user_id": req.user_id,
            "ts": datetime.utcnow().isoformat()
        })
        await posts_collection.update_one({"_id": oid}, {"$inc": {"reaction_count": 1}})
        status = "added"

    return {"status": status}

# --- BOOKMARKS ---

@app.post("/posts/{post_id}/bookmark")
async def toggle_bookmark(post_id: str, req: ViewRequest):
    try:
        oid = ObjectId(post_id)
    except:
        raise HTTPException(404, "Post not found")

    # Check if bookmark exists
    bookmark = await bookmarks_collection.find_one({
        "post_id": post_id,
        "user_id": req.user_id
    })

    if bookmark:
        # Remove
        await bookmarks_collection.delete_one({"_id": bookmark["_id"]})
        status = "removed"
    else:
        # Add
        await bookmarks_collection.insert_one({
            "post_id": post_id,
            "user_id": req.user_id,
            "ts": datetime.utcnow().isoformat()
        })
        status = "added"

    return {"status": status}

@app.get("/posts/{post_id}/bookmark-status")
async def get_bookmark_status(post_id: str, user_id: str):
    bookmark = await bookmarks_collection.find_one({
        "post_id": post_id,
        "user_id": user_id
    })
    return {"is_bookmarked": True if bookmark else False}

@app.get("/users/{user_id}/bookmarks")
async def get_user_bookmarks(user_id: str):
    cursor = bookmarks_collection.find({"user_id": user_id}).sort("ts", -1)
    
    post_ids = []
    async for doc in cursor:
        post_ids.append(ObjectId(doc["post_id"]))
    
    if not post_ids:
        return []
        
    # Fetch posts
    posts_cursor = posts_collection.find({"_id": {"$in": post_ids}})
    
    # Map for easy lookup to maintain order
    posts_dict = {}
    async for doc in posts_cursor:
        data = serialize_doc(doc)
        # Privacy Shield
        if data.get("is_anonymous", False):
            data["user_id"] = None
            data["user_pic"] = "/assets/ghost_avatar.png"
            data["username"] = "@ghost"
        posts_dict[data["id"]] = data
        
    # Return in order of bookmark timestamp
    return [posts_dict[str(pid)] for pid in post_ids if str(pid) in posts_dict]

# --- COMMENTS ---

@app.get("/posts/{post_id}/comments")
async def get_comments(post_id: str):
    cursor = comments_collection.find({"post_id": post_id}).sort("created_at", 1)
    comments = []
    async for doc in cursor:
        comments.append(serialize_doc(doc))
    return comments

@app.post("/posts/{post_id}/comments")
async def add_comment(post_id: str, comment: CommentRequest):
    await comments_collection.insert_one({
        "post_id": post_id,
        "content": comment.content,
        "user_id": comment.user_id,
        "user_name": comment.user_name,
        "user_pic": comment.user_pic,
        "created_at": datetime.utcnow().isoformat()
    })
    return {"status": "comment_added"}

# --- NOTIFICATIONS (PHASE 2) ---

from database import notifications_collection

async def create_notification(user_id: str, type: str, actor_id: str, resource_id: str = None, message: str = None):
    """
    Creates a notification for user_id.
    types: 'like', 'comment', 'connection_request', 'connection_accepted'
    """
    if user_id == actor_id:
        return # Don't notify self

    await notifications_collection.insert_one({
        "user_id": user_id,
        "type": type,
        "actor_id": actor_id,
        "resource_id": resource_id,
        "message": message,
        "is_read": False,
        "created_at": datetime.utcnow().isoformat()
    })

@app.get("/notifications")
async def get_notifications(user_id: str):
    cursor = notifications_collection.find({"user_id": user_id}).sort("created_at", -1).limit(50)
    
    notifications = []
    async for doc in cursor:
        actor = await users_collection.find_one({"_id": doc["actor_id"]})
        notifications.append({
            "id": str(doc["_id"]),
            "type": doc["type"],
            "actor_name": actor.get("display_name", "Someone") if actor else "Someone",
            "actor_pic": actor.get("photoURL") if actor else None,
            "resource_id": doc.get("resource_id"),
            "message": doc.get("message"),
            "is_read": doc.get("is_read", False),
            "created_at": doc["created_at"]
        })
    return notifications

@app.post("/notifications/{id}/read")
async def mark_notification_read(id: str):
    try:
        oid = ObjectId(id)
        await notifications_collection.update_one({"_id": oid}, {"$set": {"is_read": True}})
        return {"status": "marked_read"}
    except:
        return {"status": "error"}

# --- CONNECTIONS (SOCIAL GRAPH) ---

class ConnectRequest(BaseModel):
    requester_id: str

from database import connections_collection

@app.post("/connect/{target_id}")
async def send_connection_request(target_id: str, req: ConnectRequest):
    if req.requester_id == target_id:
        raise HTTPException(400, "Cannot connect with self")

    # Check existing
    existing = await connections_collection.find_one({
        "$or": [
            {"requester_id": req.requester_id, "target_id": target_id},
            {"requester_id": target_id, "target_id": req.requester_id}
        ]
    })
    
    if existing:
        if existing["status"] == "pending":
            return {"status": "already_pending"}
        if existing["status"] == "accepted":
            return {"status": "already_connected"}
        # If rejected/deleted, we might allow reconnect. For now assume clean slate.

    await connections_collection.insert_one({
        "requester_id": req.requester_id,
        "target_id": target_id,
        "status": "pending",
        "created_at": datetime.utcnow().isoformat()
    })
    
    # Notify Target
    await create_notification(target_id, "connection_request", req.requester_id)
    
    return {"status": "request_sent"}

@app.post("/connect/{target_id}/accept")
async def accept_connection(target_id: str, req: ConnectRequest):
    # 'req.requester_id' is the ACCEPTOR (Current User)
    # 'target_id' is the REQUESTER (The other person)
    
    doc = await connections_collection.find_one({
        "requester_id": target_id,
        "target_id": req.requester_id,
        "status": "pending"
    })

    if not doc:
        raise HTTPException(404, "No pending request found from this user")

    await connections_collection.update_one(
        {"_id": doc["_id"]},
        {"$set": {"status": "accepted", "updated_at": datetime.utcnow().isoformat()}}
    )
    
    # Notify Original Requester (target_id)
    await create_notification(target_id, "connection_accepted", req.requester_id)
    
    return {"status": "connected"}

@app.get("/network/{user_id}/status/{target_id}")
async def get_connection_status(user_id: str, target_id: str):
    # Check forward
    doc = await connections_collection.find_one({
        "requester_id": user_id,
        "target_id": target_id
    })
    if doc: return {"status": doc["status"], "is_sender": True}

    # Check reverse
    doc = await connections_collection.find_one({
        "requester_id": target_id,
        "target_id": user_id
    })
    if doc: return {"status": doc["status"], "is_sender": False}

    return {"status": "none"}

@app.get("/network/{user_id}/requests")
async def get_pending_requests(user_id: str):
    # Find people who want to connect with ME (target_id = user_id)
    cursor = connections_collection.find({
        "target_id": user_id,
        "status": "pending"
    })
    
    requests = []
    async for doc in cursor:
        # Fetch requester info
        user = await users_collection.find_one({"_id": doc["requester_id"]})
        if user:
            requests.append({
                "id": str(doc["_id"]),
                "requester_id": doc["requester_id"],
                "username": user.get("username"),
                "display_name": user.get("display_name"),
                "user_pic": user.get("photoURL"),
                "created_at": doc["created_at"]
            })
    return requests

@app.get("/network/{user_id}/connections")
async def get_my_network(user_id: str):
    # Find all accepted connections involving ME
    cursor = connections_collection.find({
        "$or": [{"requester_id": user_id}, {"target_id": user_id}],
        "status": "accepted"
    })

    connections = []
    async for doc in cursor:
        other_id = doc["target_id"] if doc["requester_id"] == user_id else doc["requester_id"]
        
        user = await users_collection.find_one({"_id": other_id})
        if user:
            connections.append({
                "user_id": other_id,
                "username": user.get("username"),
                "display_name": user.get("display_name"),
                "user_pic": user.get("photoURL"),
                "headline": user.get("headline", "Member") # Prep for Phase 3
            })
    return connections

@app.get("/stats/trending")
async def get_trending_topics():
    # Pipeline to count categories (tags)
    # Pipeline to count categories (tags)
    pipeline = [
        {"$match": {"is_rejected": False}},
        {"$unwind": "$tags"},
        {"$group": {"_id": "$tags", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 5}
    ]
    cursor = posts_collection.aggregate(pipeline)
    
    trending = []
    async for doc in cursor:
        if doc["_id"]: # Ignore None categories
            trending.append({"topic": doc["_id"], "posts_count": doc["count"]})
    
    return trending
