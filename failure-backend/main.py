import os
import firebase_admin
from firebase_admin import credentials, firestore
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from dotenv import load_dotenv

# --- 1. SETUP & SECURITY ---
load_dotenv()

if not firebase_admin._apps:
    # Use environment variable in production, local file for dev
    cred = credentials.Certificate("serviceAccountKey.json")
    firebase_admin.initialize_app(cred)

db = firestore.client()
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 2. MODELS ---

class PostRequest(BaseModel):
    user_id: str
    user_name: str
    user_pic: Optional[str] = None
    content: str
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

# --- 3. HELPER FUNCTIONS ---

def classify_category(content: str):
    content = content.lower()
    if any(w in content for w in ["job", "work", "interview", "resume", "boss", "salary"]):
        return "Career"
    if any(w in content for w in ["startup", "business", "founder", "money", "fund"]):
        return "Startup"
    if any(w in content for w in ["exam", "grade", "college", "gpa", "study"]):
        return "Academic"
    if any(w in content for w in ["breakup", "divorce", "dating", "love", "lonely"]):
        return "Relationship"
    return "Life"

def is_toxic(text: str):
    # Placeholder logic
    bad_words = ["hate", "kill", "stupid", "idiot"] 
    return any(word in text.lower() for word in bad_words)

# --- 4. CORE ROUTES ---

@app.get("/")
def home():
    return {"message": "FailureIn Backend is LIVE"}

# --- POSTS ---

@app.post("/posts/")
def create_post(post: PostRequest):
    if is_toxic(post.content):
        return {"status": "rejected", "reason": "toxicity"}

    # Fetch Username for handle
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
        "tags": post.tags,
        "created_at": datetime.utcnow().isoformat(),
        "is_anonymous": post.is_anonymous,
        "view_count": 0,
        "reaction_count": 0,
        "is_rejected": False
    }
    
    _, post_ref = db.collection("posts").add(new_post)
    return {"id": post_ref.id, "status": "posted"}

@app.get("/feed/")
def get_feed(category: Optional[str] = None):
    posts_ref = db.collection("posts").where("is_rejected", "==", False)
    
    if category and category != "All":
        posts_ref = posts_ref.where("category", "==", category)
        
    docs = posts_ref.stream()
    
    feed = []
    for doc in docs:
        data = doc.to_dict()
        # 🛡️ PRIVACY SHIELD
        if data.get("is_anonymous", False):
            data["user_id"] = None
            data["user_pic"] = "/assets/ghost_avatar.png"
            data["username"] = "@ghost"
        
        feed.append({"id": doc.id, **data})
        
    feed.sort(key=lambda x: x['created_at'], reverse=True)
    return feed

# REPLACE THE @app.get("/search/") FUNCTION IN main.py WITH THIS:

@app.get("/search/")
def search_mixed(q: str = Query(..., min_length=3)):
    q = q.lower()
    results = []

    # 1. SEARCH USERS (Find people)
    # Note: For production with 10k+ users, use Typesense/Algolia. 
    # For this project, manual filtering is fine.
    users_ref = db.collection("users").stream()
    for doc in users_ref:
        data = doc.to_dict()
        username = data.get("username", "").lower()
        if q in username:
            results.append({
                "type": "user",  # <--- MARK AS USER
                "id": doc.id,
                "username": data.get("username"),
                "user_pic": data.get("photoURL"), 
                "display_name": data.get("display_name"),
            })

    # 2. SEARCH POSTS (Find stories)
    posts_ref = db.collection("posts").where("is_rejected", "==", False).stream()
    for doc in posts_ref:
        data = doc.to_dict()
        content = data.get("content", "").lower()
        tags = [t.lower() for t in data.get("tags", [])]
        category = data.get("category", "").lower()
        author_handle = data.get("username", "").lower() # Check author name too
        
        if q in content or q in tags or q in category or q in author_handle:
            
            # Privacy Shield
            if data.get("is_anonymous", False):
                data["user_id"] = None
                data["user_pic"] = "/assets/ghost_avatar.png"
                data["username"] = "@ghost"
                # If searching for a specific person, don't show their anonymous posts
                if q in author_handle: 
                    continue 

            results.append({
                "type": "post", # <--- MARK AS POST
                "id": doc.id, 
                **data
            })
            
    return results

@app.delete("/posts/{post_id}")
def delete_post(post_id: str, user_id: str):
    post_ref = db.collection("posts").document(post_id)
    snapshot = post_ref.get()
    
    if not snapshot.exists:
        raise HTTPException(status_code=404, detail="Post not found")
        
    if snapshot.to_dict().get("user_id") != user_id:
        raise HTTPException(status_code=403, detail="Permission denied")
        
    post_ref.delete()
    return {"status": "deleted"}

# --- INTERACTIONS (LIKES & VIEWS) ---

@app.post("/posts/{post_id}/view")
def increment_view(post_id: str, request: ViewRequest):
    post_ref = db.collection("posts").document(post_id)
    post_ref.update({"view_count": firestore.Increment(1)})
    return {"status": "view_counted"}

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

# --- COMMENTS ---

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

# --- USER PROFILES ---

@app.get("/users/{user_id}/profile")
def get_user_profile(user_id: str):
    user_doc = db.collection("users").document(user_id).get()
    user_data = user_doc.to_dict() if user_doc.exists else {}

    posts_ref = db.collection("posts").where("user_id", "==", user_id)
    docs = posts_ref.stream()

    user_posts = []
    total_views = 0
    total_posts = 0
    
    for doc in docs:
        data = doc.to_dict()
        total_views += data.get("view_count", 0)
        total_posts += 1
        user_posts.append({"id": doc.id, **data})
    
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

@app.post("/users/set-username")
def set_username(req: UsernameRequest):
    username = req.username.strip().lower()
    
    if len(username) < 3 or " " in username:
        raise HTTPException(status_code=400, detail="Invalid username format")

    existing = db.collection("users").where("username", "==", username).get()
    if len(existing) > 0:
        raise HTTPException(status_code=409, detail="Username taken")

    db.collection("users").document(req.user_id).set({
        "username": username,
        "updated_at": datetime.utcnow().isoformat()
    }, merge=True)

    return {"status": "success", "username": username}