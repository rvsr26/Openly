import os
import firebase_admin
from firebase_admin import credentials, firestore
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from dotenv import load_dotenv
# ... other imports
from ai_utils import is_toxic  # <--- IMPORT YOUR UTILITY

# 1. LOAD ENV & INIT APP
load_dotenv()
app = FastAPI()

# 2. CORS SETUP (Frontend Connection)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. FIREBASE INIT
if not firebase_admin._apps:
    cred = credentials.Certificate("serviceAccountKey.json")
    firebase_admin.initialize_app(cred)
db = firestore.client()

# --- MODELS (DEFINITIONS) MUST BE AT THE TOP ---

class PostRequest(BaseModel):
    user_id: str
    user_name: str
    user_pic: Optional[str] = None
    content: str
    is_anonymous: bool = False

class ViewRequest(BaseModel):
    user_id: str

class CommentRequest(BaseModel):
    content: str
    user_id: str
    user_name: str
    user_pic: str

class UsernameRequest(BaseModel):
    user_id: str
    username: str

# --- HELPER FUNCTIONS ---

def classify_category(content: str):
    content = content.lower()
    if "job" in content or "work" in content or "interview" in content:
        return "Career"
    if "startup" in content or "business" in content or "founder" in content:
        return "Startup"
    if "exam" in content or "grade" in content or "college" in content:
        return "Academic"
    if "breakup" in content or "divorce" in content or "dating" in content:
        return "Relationship"
    return "All" # Default

def is_toxic(text: str):
    # Placeholder for AI Logic
    # In production, use Google Perspective API or OpenAI moderation here
    bad_words = ["hate", "kill", "stupid", "idiot"] 
    return any(word in text.lower() for word in bad_words)

# --- ROUTES (ENDPOINTS) ---

@app.get("/")
def home():
    return {"message": "FailureIn Backend is Running"}

# 1. CREATE POST
@app.post("/posts/")
def create_post(post: PostRequest):
    # Toxicity Check
    if is_toxic(post.content):
        # We save it but mark it as rejected so it doesn't show in feed
        rejected_post = {
            "user_id": post.user_id,
            "content": post.content,
            "is_rejected": True,
            "reason": "toxicity",
            "created_at": datetime.utcnow().isoformat()
        }
        db.collection("posts").add(rejected_post)
        return {"status": "rejected_for_toxicity"}

    # Fetch Username for Handle
    user_doc = db.collection("users").document(post.user_id).get()
    username = "@anonymous"
    if user_doc.exists:
        data = user_doc.to_dict()
        if data and "username" in data:
            username = "@" + data["username"]

    new_post = {
        "user_id": post.user_id,
        "user_name": "Anonymous" if post.is_anonymous else post.user_name,
        "user_pic": None if post.is_anonymous else post.user_pic,
        "username": "@anonymous" if post.is_anonymous else username,
        "content": post.content,
        "category": classify_category(post.content),
        "created_at": datetime.utcnow().isoformat(),
        "is_anonymous": post.is_anonymous,
        "view_count": 0,
        "reaction_count": 0,
        "is_rejected": False
    }
    
    update_time, post_ref = db.collection("posts").add(new_post)
    return {"id": post_ref.id, "status": "posted"}

# 2. GET FEED
@app.get("/feed/")
def get_feed(category: Optional[str] = None):
    posts_ref = db.collection("posts").where("is_rejected", "==", False)
    
    if category and category != "All":
        posts_ref = posts_ref.where("category", "==", category)
        
    docs = posts_ref.stream()
    
    feed = []
    for doc in docs:
        data = doc.to_dict()
        feed.append({
            "id": doc.id,
            **data
        })
        
    feed.sort(key=lambda x: x['created_at'], reverse=True)
    return feed

# 3. GET USER PROFILE
@app.get("/users/{user_id}/profile")
def get_user_profile(user_id: str):
    # Fetch User Details
    user_doc = db.collection("users").document(user_id).get()
    user_data = user_doc.to_dict() if user_doc.exists else {}

    # Fetch Posts
    posts_ref = db.collection("posts").where("user_id", "==", user_id)
    docs = posts_ref.stream()

    user_posts = []
    total_views = 0
    total_posts = 0
    
    for doc in docs:
        data = doc.to_dict()
        total_views += data.get("view_count", 0)
        total_posts += 1
        user_posts.append({
            "id": doc.id,
            **data
        })
    
    # Sort posts
    user_posts.sort(key=lambda x: x['created_at'], reverse=True)
    
    reputation = (total_posts * 10) + total_views

    return {
        "user_info": {
            "username": user_data.get("username", None),
            "display_name": user_data.get("display_name", "Anonymous")
        },
        "stats": {
            "reputation": reputation,
            "total_views": total_views,
            "total_posts": total_posts
        },
        "posts": user_posts
    }

# 4. SET USERNAME
@app.post("/users/set-username")
def set_username(req: UsernameRequest):
    username = req.username.strip().lower()
    
    if not username or len(username) < 3:
        raise HTTPException(status_code=400, detail="Username must be at least 3 characters.")
        
    if " " in username:
        raise HTTPException(status_code=400, detail="Username cannot contain spaces.")

    # Check Uniqueness
    existing_users = db.collection("users").where("username", "==", username).get()
    if len(existing_users) > 0:
        raise HTTPException(status_code=409, detail="Username is already taken.")

    # Save
    user_ref = db.collection("users").document(req.user_id)
    user_ref.set({
        "username": username,
        "updated_at": datetime.utcnow().isoformat()
    }, merge=True)

    return {"status": "success", "username": username}

# 5. VIEW COUNTING
@app.post("/posts/{post_id}/view")
def increment_view(post_id: str, request: ViewRequest):
    # Check if user already viewed this specific post (Optional logic)
    # For now, we just increment
    post_ref = db.collection("posts").document(post_id)
    post_ref.update({"view_count": firestore.Increment(1)})
    return {"status": "view_counted"}

# 6. REACTION (LIKE/RESPECT)
@app.post("/posts/{post_id}/react")
def toggle_reaction(post_id: str, request: ViewRequest):
    post_ref = db.collection("posts").document(post_id)
    reaction_ref = post_ref.collection("reactions").document(request.user_id)
    
    batch = db.batch()
    
    if reaction_ref.get().exists:
        batch.delete(reaction_ref)
        batch.update(post_ref, {"reaction_count": firestore.Increment(-1)})
        status = "removed"
    else:
        batch.set(reaction_ref, {"timestamp": datetime.utcnow().isoformat()})
        batch.update(post_ref, {"reaction_count": firestore.Increment(1)})
        status = "added"
        
    batch.commit()
    return {"status": status}

# 7. DELETE POST
@app.delete("/posts/{post_id}")
def delete_post(post_id: str, user_id: str):
    post_ref = db.collection("posts").document(post_id)
    snapshot = post_ref.get()
    
    if not snapshot.exists:
        raise HTTPException(status_code=404, detail="Post not found")
        
    # Check Ownership
    if snapshot.to_dict().get("user_id") != user_id:
        raise HTTPException(status_code=403, detail="Permission denied")
        
    post_ref.delete()
    return {"status": "deleted"}

# 8. COMMENTS
@app.get("/posts/{post_id}/comments")
def get_comments(post_id: str):
    comments_ref = db.collection("posts").document(post_id).collection("comments")
    docs = comments_ref.order_by("created_at").stream()
    return [{"id": d.id, **d.to_dict()} for d in docs]

@app.post("/posts/{post_id}/comments")
def add_comment(post_id: str, comment: CommentRequest):
    comments_ref = db.collection("posts").document(post_id).collection("comments")
    comments_ref.add({
        "content": comment.content,
        "user_id": comment.user_id,
        "user_name": comment.user_name,
        "user_pic": comment.user_pic,
        "created_at": datetime.utcnow().isoformat()
    })
    return {"status": "comment_added"}