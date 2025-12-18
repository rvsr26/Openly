import os
import firebase_admin
from firebase_admin import credentials, firestore
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from dotenv import load_dotenv
from ai_utils import is_toxic  # ✅ single source of truth

# ---------------- INIT ----------------
load_dotenv()
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if not firebase_admin._apps:
    cred = credentials.Certificate("serviceAccountKey.json")
    firebase_admin.initialize_app(cred)

db = firestore.client()

# ---------------- MODELS ----------------
class PostRequest(BaseModel):
    user_id: str
    user_name: str
    user_pic: Optional[str] = None
    content: str
    category: Optional[str] = "All"
    image_url: Optional[str] = None
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

# ---------------- HELPERS ----------------
def classify_category(content: str):
    text = content.lower()
    if any(w in text for w in ["job", "work", "interview"]):
        return "Career"
    if any(w in text for w in ["startup", "business", "founder"]):
        return "Startup"
    if any(w in text for w in ["exam", "grade", "college"]):
        return "Academic"
    if any(w in text for w in ["breakup", "dating", "divorce"]):
        return "Relationship"
    return "Other"

# ---------------- ROUTES ----------------
@app.get("/")
def home():
    return {"message": "FailureIn Backend is Running"}

# ---------------- CREATE POST ----------------
@app.post("/posts/")
def create_post(post: PostRequest):

    if is_toxic(post.content):
        db.collection("posts").add({
            "user_id": post.user_id,
            "content": post.content,
            "is_rejected": True,
            "created_at": datetime.utcnow().isoformat()
        })
        return {"status": "rejected_for_toxicity"}

    user_doc = db.collection("users").document(post.user_id).get()
    username = "@anonymous"

    if user_doc.exists:
        username = "@" + user_doc.to_dict().get("username", "anonymous")

    new_post = {
        "user_id": post.user_id,
        "user_name": "Anonymous" if post.is_anonymous else post.user_name,
        "user_pic": None if post.is_anonymous else post.user_pic,
        "username": "@anonymous" if post.is_anonymous else username,
        "content": post.content,
        "category": post.category or classify_category(post.content),
        "image_url": post.image_url,
        "created_at": datetime.utcnow().isoformat(),
        "is_anonymous": post.is_anonymous,
        "view_count": 0,
        "reaction_count": 0,
        "is_rejected": False
    }

    _, ref = db.collection("posts").add(new_post)
    return {"id": ref.id, "status": "posted"}

# ---------------- FEED ----------------
@app.get("/feed/")
def get_feed(category: Optional[str] = None):
    ref = db.collection("posts").where("is_rejected", "==", False)

    if category and category != "All":
        ref = ref.where("category", "==", category)

    posts = [{"id": d.id, **d.to_dict()} for d in ref.stream()]
    posts.sort(key=lambda x: x["created_at"], reverse=True)
    return posts

# ---------------- SINGLE POST ----------------
@app.get("/posts/{post_id}")
def get_post(post_id: str):
    doc = db.collection("posts").document(post_id).get()
    if not doc.exists:
        raise HTTPException(404, "Post not found")
    return {"id": doc.id, **doc.to_dict()}

# ---------------- PROFILE ----------------
@app.get("/users/{user_id}/profile")
def get_user_profile(user_id: str):
    user_doc = db.collection("users").document(user_id).get()
    user_data = user_doc.to_dict() if user_doc.exists else {}

    posts_ref = db.collection("posts").where("user_id", "==", user_id)
    posts = []
    views = 0

    for d in posts_ref.stream():
        data = d.to_dict()
        views += data.get("view_count", 0)
        posts.append({"id": d.id, **data})

    posts.sort(key=lambda x: x["created_at"], reverse=True)

    return {
        "user_info": {
            "username": user_data.get("username"),
            "display_name": user_data.get("display_name", "Anonymous")
        },
        "stats": {
            "total_posts": len(posts),
            "total_views": views,
            "reputation": (len(posts) * 10) + views
        },
        "posts": posts
    }

# ---------------- PUBLIC PROFILE ----------------
@app.get("/users/username/{username}")
def public_profile(username: str):
    users = db.collection("users").where("username", "==", username).get()
    if not users:
        raise HTTPException(404, "User not found")
    return get_user_profile(users[0].id)

# ---------------- USERNAME ----------------
@app.post("/users/set-username")
def set_username(req: UsernameRequest):
    username = req.username.strip().lower()

    if len(username) < 3:
        raise HTTPException(400, "Username too short")

    if db.collection("users").where("username", "==", username).get():
        raise HTTPException(409, "Username already taken")

    db.collection("users").document(req.user_id).set({
        "username": username,
        "updated_at": datetime.utcnow().isoformat()
    }, merge=True)

    return {"status": "success", "username": username}

# ---------------- VIEWS ----------------
@app.post("/posts/{post_id}/view")
def increment_view(post_id: str, req: ViewRequest):
    db.collection("posts").document(post_id).update({
        "view_count": firestore.Increment(1)
    })
    return {"status": "view_counted"}

# ---------------- REACTIONS ----------------
@app.post("/posts/{post_id}/react")
def toggle_reaction(post_id: str, req: ViewRequest):
    post_ref = db.collection("posts").document(post_id)
    react_ref = post_ref.collection("reactions").document(req.user_id)

    batch = db.batch()

    if react_ref.get().exists:
        batch.delete(react_ref)
        batch.update(post_ref, {"reaction_count": firestore.Increment(-1)})
        status = "removed"
    else:
        batch.set(react_ref, {"ts": datetime.utcnow().isoformat()})
        batch.update(post_ref, {"reaction_count": firestore.Increment(1)})
        status = "added"

    batch.commit()
    return {"status": status}

# ---------------- DELETE POST ----------------
@app.delete("/posts/{post_id}")
def delete_post(post_id: str, user_id: str):
    ref = db.collection("posts").document(post_id)
    doc = ref.get()

    if not doc.exists:
        raise HTTPException(404, "Post not found")

    if doc.to_dict().get("user_id") != user_id:
        raise HTTPException(403, "Permission denied")

    ref.delete()
    return {"status": "deleted"}

# ---------------- COMMENTS ----------------
@app.get("/posts/{post_id}/comments")
def get_comments(post_id: str):
    ref = db.collection("posts").document(post_id).collection("comments")
    return [{"id": d.id, **d.to_dict()} for d in ref.order_by("created_at").stream()]

@app.post("/posts/{post_id}/comments")
def add_comment(post_id: str, comment: CommentRequest):
    db.collection("posts").document(post_id).collection("comments").add({
        **comment.dict(),
        "created_at": datetime.utcnow().isoformat()
    })
    return {"status": "comment_added"}
