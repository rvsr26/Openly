import os
import json
from fastapi import FastAPI, HTTPException, Query, File, UploadFile, Request, WebSocket, WebSocketDisconnect, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime, timezone, timedelta
import shutil
from dotenv import load_dotenv
load_dotenv()  # Load environment variables early
import cloudinary
import cloudinary.uploader
import re
from ai_utils import is_toxic, extract_keywords, summarize_text, enhance_content, get_sentiment, cluster_tags
from database import (
    posts_collection, users_collection, comments_collection, reactions_collection, 
    bookmarks_collection, reports_collection, drafts_collection, downvotes_collection, 
    views_collection, messages_collection, conversations_collection,
    verification_tokens_collection, password_reset_tokens_collection,
    connections_collection, settings_collection
)
from bson import ObjectId
from cache_utils import get_cached_feed, set_cached_feed, generate_cache_key, invalidate_category_cache
from messaging_endpoints import router as messaging_router
from activity_endpoints import router as activity_router
from timelines import router as timelines_router
from admin_api import router as admin_router
from alias_manager import (
    create_alias, get_user_aliases, get_alias_by_id, update_alias, 
    delete_alias, activate_alias, deactivate_all_aliases, get_active_alias,
    AliasCreate, AliasUpdate
)
from communities import (
    create_community, get_community, list_communities, update_community, delete_community,
    join_community, leave_community, get_members, approve_member, kick_member,
    promote_member, demote_member, get_user_communities, get_community_posts,
    CommunityCreate, CommunityUpdate
)
from polls import PollCreate, build_poll_doc, cast_vote, get_poll
from insights import send_insight_report

# Import authentication and middleware (optional - won't break app if missing)
AUTH_ENABLED = False
try:
    from auth import (
        send_verification_email, verify_email_token, send_password_reset_email, 
        reset_password, handle_oauth_login, create_access_token, get_current_user,
        EmailVerificationRequest, VerifyEmailRequest, PasswordResetRequest, 
        PasswordResetConfirm, OAuthLoginRequest,
        generate_2fa_secret, get_2fa_qr_code, verify_2fa_code, authenticate_user
    )
    from middleware import (
        RateLimitMiddleware, SecurityHeadersMiddleware, RequestLoggingMiddleware,
        RequestIDMiddleware, sanitize_input, validate_email, validate_username,
        validate_password_strength
    )
    AUTH_ENABLED = True
    print("[SUCCESS] Authentication and security middleware loaded successfully")
except Exception as e:
    print(f"[ERROR] Authentication module not available: {e}")
    print("[WARNING] App will run without Phase 1 auth features")
    # Define dummy functions to prevent errors
    class EmailVerificationRequest(BaseModel):
        email: str
        user_id: str
    class VerifyEmailRequest(BaseModel):
        token: str
    class PasswordResetRequest(BaseModel):
        email: str
    class PasswordResetConfirm(BaseModel):
        token: str
        new_password: str
    class OAuthLoginRequest(BaseModel):
        provider: str
        access_token: str
        user_info: dict
    class LoginRequest(BaseModel):
        email: str
        password: str
    class TwoFactorEnableRequest(BaseModel):
        code: str
    class TwoFactorVerifyLoginRequest(BaseModel):
        user_id: str
        code: str
    
    # Dummy function placeholders
    async def send_verification_email(*args, **kwargs): pass
    async def verify_email_token(*args, **kwargs): return {"status": "error", "message": "Auth disabled"}
    async def send_password_reset_email(*args, **kwargs): return {"status": "error", "message": "Auth disabled"}
    async def reset_password(*args, **kwargs): return {"status": "error", "message": "Auth disabled"}
    async def handle_oauth_login(*args, **kwargs): return {"status": "error", "message": "Auth disabled"}
    def create_access_token(*args, **kwargs): return "dummy-token"
    async def get_current_user(request: Request): return {"_id": "dummy", "email": "dummy@example.com"}
    def generate_2fa_secret(*args, **kwargs): return "secret"
    def get_2fa_qr_code(*args, **kwargs): return "qr"
    async def verify_2fa_code(*args, **kwargs): return False
    async def authenticate_user(*args, **kwargs): return None
    def validate_password_strength(*args, **kwargs): return {"valid": True, "errors": []}
    async def authenticate_user(*args, **kwargs):
        return None
    
    async def authenticate_user(*args, **kwargs):
        return None
        
    def generate_2fa_secret(): return "dummy_secret"
    def get_2fa_qr_code(email, secret): return "dummy_qr"
    def verify_2fa_code(secret, code): return False
    
    async def get_current_user(): 
        return None


# Models
class ProfessionalExperience(BaseModel):
    company: str
    position: str
    location: Optional[str] = None
    start_date: str
    end_date: Optional[str] = None
    current: bool = False
    description: Optional[str] = None

class Education(BaseModel):
    school: str
    degree: Optional[str] = None
    field: Optional[str] = None
    start_date: str
    end_date: Optional[str] = None

class Skill(BaseModel):
    name: str
    level: Optional[str] = None 
    endorsements: int = 0

class User(BaseModel):
    uid: str
    email: str
    display_name: str
    username: str
    photoURL: Optional[str] = None
    role: str = "user"
    is_banned: bool = False
    
class ProfessionalInfoUpdate(BaseModel):
    headline: Optional[str] = None
    bio: Optional[str] = None
    website: Optional[str] = None
    location: Optional[str] = None
    experiences: Optional[List[ProfessionalExperience]] = None
    education: Optional[List[Education]] = None
    skills: Optional[List[Skill]] = None

# --- 1. SETUP ---
app = FastAPI(title="Openly API", version="1.0.0")

# Include Routers
# (Routers will be included after CORS)

# Add security middleware (if available)
if AUTH_ENABLED:
    app.add_middleware(RequestIDMiddleware)
    app.add_middleware(SecurityHeadersMiddleware)
    # app.add_middleware(RateLimitMiddleware)
    app.add_middleware(RequestLoggingMiddleware)
    print("[SUCCESS] Security middleware registered")
else:
    print("[WARNING] Running without security middleware")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://127.0.0.1:3002",
        os.getenv("FRONTEND_URL", "http://localhost:3000")
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Request-ID"],
)

# Include Routers
app.include_router(messaging_router)
app.include_router(activity_router)
app.include_router(timelines_router)
app.include_router(admin_router)

# --- STATIC FILES ---
# Configure Cloudinary
cloudinary_url = os.getenv("CLOUDINARY_URL")
if cloudinary_url:
    cloudinary.config(cloudinary_url=cloudinary_url)
    print(f"[SUCCESS] Cloudinary configured with URL: {cloudinary_url[:20]}...")
else:
    print("[WARNING] CLOUDINARY_URL not found in environment")

UPLOAD_DIR = "uploads"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

@app.post("/upload")
@app.post("/upload/image")
async def upload_file(file: UploadFile = File(...)):
    """
    Upload a file to Cloudinary.
    Returns the secure URL of the uploaded file.
    """
    try:
        # Upload to Cloudinary
        # We pass the file content directly for better reliability
        file_content = await file.read()
        result = cloudinary.uploader.upload(
            file_content,
            folder="openly_uploads",
            resource_type="auto"
        )
        
        # Get the secure URL
        file_url = result.get("secure_url")
        
        if not file_url:
            raise Exception("Failed to get secure URL from Cloudinary")
            
        print(f"[SUCCESS] File uploaded to Cloudinary: {file_url}")
        return {"url": file_url}
    except Exception as e:
        print(f"[ERROR] Cloudinary upload failed: {e}")
        raise HTTPException(status_code=500, detail=f"File upload failed: {str(e)}")

@app.post("/admin/migrate/clear-stale-photos")
async def migrate_clear_stale_photos():
    """One-time migration: clears stale /uploads/ paths and replaces them with None."""
    import re
    stale_regex = re.compile(r"^/uploads/", re.IGNORECASE)
    
    users_fixed = 0
    posts_fixed = 0
    
    # Fix users collection
    async for user in users_collection.find({"photoURL": {"$regex": "^/uploads/", "$options": "i"}}):
        uid = user["_id"]
        await users_collection.update_one({"_id": uid}, {"$set": {"photoURL": None}})
        users_fixed += 1
    
    # Fix posts collection
    result = await posts_collection.update_many(
        {"user_pic": {"$regex": "^/uploads/", "$options": "i"}},
        {"$set": {"user_pic": None}}
    )
    posts_fixed = result.modified_count
    
    return {
        "status": "done",
        "users_fixed": users_fixed,
        "posts_fixed": posts_fixed
    }

# --- STARTUP: DATABASE INDEXING ---
@app.on_event("startup")
async def startup_event():
    """Start background tasks on startup."""
    import asyncio
    # Run index creation in background so it doesn't block startup
    asyncio.create_task(create_indexes())

async def create_indexes():
    """Create database indexes for optimized query performance."""
    try:
        # Compound index for hot feed sorting
        await posts_collection.create_index([("reaction_count", -1), ("created_at", -1)])
        
        # Index for category filtering
        await posts_collection.create_index([("category", 1), ("created_at", -1)])
        
        # Index for top sorting
        await posts_collection.create_index([("reaction_count", -1)])
        
        # Index for filtering rejected posts
        await posts_collection.create_index([("is_rejected", 1), ("category", 1)])
        
        print("[SUCCESS] Database indexes created successfully")

        # Initialize default System Settings if none exist
        existing_settings = await settings_collection.find_one({"_id": "global_settings"})
        if not existing_settings:
            await settings_collection.insert_one({
                "_id": "global_settings",
                "maintenance_mode": False,
                "broadcast_message": "",
                "read_only_mode": False,
                "pause_registrations": False,
                "disable_dms": False,
                "require_verified_email": False
            })
            print("[SUCCESS] Initialized default global system settings.")

    except Exception as e:
        print(f"[ERROR] Error creating indexes: {e}")

# --- 2. MODELS ---

class PostRequest(BaseModel):
    user_id: str
    user_name: str
    user_pic: Optional[str] = None
    content: str
    title: Optional[str] = None
    category: Optional[str] = "All"
    hubs: List[str] = []
    image_url: Optional[str] = None
    is_anonymous: bool = False
    timeline_id: Optional[str] = None
    collaborators: List[str] = [] # List of user_ids
    tags: List[str] = [] 
    is_professional_inquiry: Optional[bool] = False
    poll: Optional[PollCreate] = None
    community_id: Optional[str] = None

class PostUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    category: Optional[str] = None
    tags: Optional[List[str]] = None
class ViewRequest(BaseModel):
    user_id: str

class CommentRequest(BaseModel):
    content: str
    user_id: str
    user_name: str
    user_pic: Optional[str] = None
    parent_id: Optional[str] = None

class UsernameRequest(BaseModel):
    user_id: str
    username: str

class ReportRequest(BaseModel):
    reporter_id: str
    target_id: str
    target_type: str  # 'post' or 'user'
    reason: str
    details: Optional[str] = None

class DraftRequest(BaseModel):
    user_id: str
    content: str
    title: Optional[str] = None
    category: Optional[str] = "All"
    hubs: List[str] = []
    image_url: Optional[str] = None
    is_anonymous: bool = False
    tags: List[str] = []

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TwoFactorEnableRequest(BaseModel):
    code: str

class TwoFactorVerifyLoginRequest(BaseModel):
    user_id: str
    code: str

class EnhancePostRequest(BaseModel):
    content: str
    title: Optional[str] = ""

class SentimentRequest(BaseModel):
    text: str

class ChatRequest(BaseModel):
    message: str
    history: Optional[List[dict]] = [] # [{"role": "user", "parts": ["..."]}, ...]

# --- 3. HELPER FUNCTIONS ---

def serialize_doc(doc):
    if not doc: return None
    doc["id"] = str(doc["_id"])
    del doc["_id"]
    # Frontend Compatibility: Map user_name to author
    if "user_name" in doc and "author" not in doc:
        doc["author"] = doc["user_name"]
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

async def get_user_by_any_id(user_id: str):
    """Find a user by id string, handling both direct match and ObjectId."""
    if not user_id: return None
    # 1. Try direct match on _id (string id)
    user = await users_collection.find_one({"_id": user_id})
    if not user:
        # 2. Try match on uid field
        user = await users_collection.find_one({"uid": user_id})
    if not user:
        # 3. Try match on _id as ObjectId
        try:
            user = await users_collection.find_one({"_id": ObjectId(user_id)})
        except:
            pass
    if not user:
        # 4. Try match on username as last resort
        user = await users_collection.find_one({"username": user_id.lower()})
    return user

# --- 4. CORE ROUTES ---

@app.get("/")
def read_root():
    return {"message": "Openly Backend is LIVE (MongoDB)", "version": "1.0.0"}

# ==================== AUTHENTICATION ENDPOINTS ====================

@app.post("/api/v1/auth/send-verification")
async def api_send_verification(req: EmailVerificationRequest):
    """Send email verification link"""
    try:
        await send_verification_email(req.email, req.user_id)
        return {"status": "sent", "message": "Verification email sent"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/auth/verify-email")
async def api_verify_email(req: VerifyEmailRequest):
    """Verify email with token"""
    result = await verify_email_token(req.token)
    return result

@app.post("/api/v1/auth/forgot-password")
async def api_forgot_password(req: PasswordResetRequest):
    """Send password reset link"""
    result = await send_password_reset_email(req.email)
    return result

@app.post("/api/v1/auth/reset-password")
async def api_reset_password(req: PasswordResetConfirm):
    """Reset password with token"""
    validation = validate_password_strength(req.new_password)
    if not validation["valid"]:
        raise HTTPException(status_code=400, detail={"errors": validation["errors"]})
    
    result = await reset_password(req.token, req.new_password)
    return result

@app.post("/api/v1/auth/oauth/login")
async def api_oauth_login(req: OAuthLoginRequest):
    """Handle OAuth login (Google, GitHub, LinkedIn)"""
    result = await handle_oauth_login(req.provider, req.access_token, req.user_info)
    return result

@app.post("/api/v1/auth/login")
async def api_login(req: LoginRequest):
    """Standard Email/Password Login"""
    result = await authenticate_user(req.email, req.password)
    if not result:
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    if "2fa_required" in result:
        return {
            "2fa_required": True,
            "user_id": result["user_id"],
            "message": "Two-factor authentication required"
        }
        
    # Generate JWT
    access_token = create_access_token({"sub": result["_id"], "email": result.get("email")})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": result["_id"],
        "user": {
            "id": result["_id"],
            "email": result.get("email"),
            "username": result.get("username"),
            "display_name": result.get("display_name"),
            "photoURL": result.get("photoURL"),
            "role": result.get("role", "user")
        }
    }

@app.post("/api/v1/auth/2fa/setup")
async def api_2fa_setup(user = Depends(get_current_user)):
    """Initialize 2FA setup - Returns Secret and QR Code"""
    secret = generate_2fa_secret()
    
    # Save secret temporarily or permanently? 
    # Usually we save it to the user record but mark it as not yet verified/enabled.
    # Or just return it and save it when they verify.
    # Let's save it to the user record with `two_factor_secret` and `two_factor_enabled=False`
    
    await users_collection.update_one(
        {"_id": user["_id"]},
        {"$set": {"two_factor_temp_secret": secret}}
    )
    
    qr_code = get_2fa_qr_code(user["email"], secret)
    
    return {
        "secret": secret,
        "qr_code": qr_code
    }

@app.post("/api/v1/auth/2fa/enable")
async def api_2fa_enable(req: TwoFactorEnableRequest, user = Depends(get_current_user)):
    """Verify code and enable 2FA"""
    # Get temp secret
    user_doc = await users_collection.find_one({"_id": user["_id"]})
    secret = user_doc.get("two_factor_temp_secret")
    
    if not secret:
        raise HTTPException(status_code=400, detail="2FA setup not initialized")
        
    if verify_2fa_code(secret, req.code):
        await users_collection.update_one(
            {"_id": user["_id"]},
            {
                "$set": {
                    "two_factor_enabled": True,
                    "two_factor_secret": secret
                },
                "$unset": {"two_factor_temp_secret": ""}
            }
        )
        return {"status": "success", "message": "2FA enabled successfully"}
    else:
        raise HTTPException(status_code=400, detail="Invalid verification code")

@app.post("/api/v1/auth/2fa/verify-login")
async def api_2fa_verify_login(req: TwoFactorVerifyLoginRequest):
    """Complete login with 2FA code"""
    user = await users_collection.find_one({"_id": req.user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if not user.get("two_factor_enabled"):
        raise HTTPException(status_code=400, detail="2FA not enabled for this user")
        
    secret = user.get("two_factor_secret")
    if verify_2fa_code(secret, req.code):
        # Generate JWT
        access_token = create_access_token({"sub": user["_id"], "email": user.get("email")})
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user_id": user["_id"],
             "user": {
                "id": user["_id"],
                "email": user.get("email"),
                "username": user.get("username"),
                "display_name": user.get("display_name"),
                "photoURL": user.get("photoURL")
            }
        }
    else:
         raise HTTPException(status_code=401, detail="Invalid 2FA code")

@app.post("/api/v1/auth/2fa/disable")
async def api_2fa_disable(user = Depends(get_current_user)):
    """Disable 2FA"""
    await users_collection.update_one(
        {"_id": user["_id"]},
        {
            "$set": {"two_factor_enabled": False},
            "$unset": {"two_factor_secret": "", "two_factor_temp_secret": ""}
        }
    )
    return {"status": "success", "message": "2FA disabled"}

class UserSyncRequest(BaseModel):
    uid: str
    email: EmailStr
    display_name: Optional[str] = None
    photoURL: Optional[str] = None

@app.post("/api/v1/auth/sync")
async def api_sync_user(req: UserSyncRequest):
    """Sync Firebase user to MongoDB and return backend JWT"""
    # Check if user exists
    user = await get_user_by_any_id(req.uid)
    
    now = datetime.now(timezone.utc).isoformat()
    
    if user:
        # Update metadata
        update_data = {"last_synced_at": now}
        if req.email: update_data["email"] = req.email
        if req.display_name: update_data["display_name"] = req.display_name
        
        # Only update photoURL if it's a valid external URL (not a local /uploads/ path)
        if req.photoURL and (req.photoURL.startswith("http") or req.photoURL.startswith("https")):
            old_photo = user.get("photoURL", "")
            update_data["photoURL"] = req.photoURL
            # Propagate to all this user's posts only if the URL actually changed
            if old_photo != req.photoURL:
                await posts_collection.update_many(
                    {"user_id": req.uid, "is_anonymous": {"$ne": True}},
                    {"$set": {"user_pic": req.photoURL}}
                )
        
        await users_collection.update_one({"_id": req.uid}, {"$set": update_data})
    else:
        # Check Registration Pause before creating a new user
        settings = await settings_collection.find_one({"_id": "global_settings"})
        if settings and settings.get("pause_registrations"):
            raise HTTPException(status_code=403, detail="New registrations are temporarily paused.")

        # Create user
        new_user = {
            "_id": req.uid,
            "email": req.email,
            "display_name": req.display_name or "",
            "photoURL": req.photoURL or "",
            "created_at": now,
            "email_verified": True, # Assumed if coming from valid Firebase session in this simple sync
            "last_synced_at": now
        }
        await users_collection.insert_one(new_user)
    
    # Post-sync 2FA Check
    updated_user = await users_collection.find_one({"_id": req.uid})
    if updated_user and updated_user.get("two_factor_enabled"):
         return {
            "2fa_required": True,
            "user_id": req.uid,
            "message": "Two-factor authentication required"
        }

    # Generate Backend JWT
    token = "dummy_token"
    if AUTH_ENABLED:
        try:
            from auth import create_access_token
            token = create_access_token({"sub": req.uid, "email": req.email})
        except ImportError:
            print("[WARNING] Auth module import failed in sync endpoint")
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "user_id": req.uid,
        "two_factor_enabled": updated_user.get("two_factor_enabled", False) if updated_user else False,
        "role": updated_user.get("role", "user") if updated_user else "user"
    }

@app.get("/api/v1/auth/me")
async def api_get_current_user(user = Depends(get_current_user)):
    """Get current authenticated user"""
    return {
        "id": user["_id"],
        "email": user.get("email"),
        "username": user.get("username"),
        "display_name": user.get("display_name"),
        "photoURL": user.get("photoURL"),
        "email_verified": user.get("email_verified", False),
        "two_factor_enabled": user.get("two_factor_enabled", False),
        "role": user.get("role", "user")
    }

@app.post("/api/v1/auth/validate-username")
async def api_validate_username(username: str):
    """Check if username is valid and available"""
    if not validate_username(username):
        return {
            "valid": False,
            "available": False,
            "error": "Username must be 3-30 characters and contain only letters, numbers, underscores, and hyphens"
        }
    
    existing = await users_collection.find_one({"username": username.lower()})
    
    return {
        "valid": True,
        "available": existing is None,
        "error": None if existing is None else "Username already taken"
    }

@app.post("/api/v1/auth/validate-email")
async def api_validate_email(email: EmailStr):
    """Check if email is valid and available"""
    existing = await users_collection.find_one({"email": email.lower()})
    
    return {
        "valid": validate_email(email),
        "available": existing is None,
        "error": None if existing is None else "Email already registered"
    }

class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str

@app.post("/api/v1/auth/change-password")
async def api_change_password(req: ChangePasswordRequest, user = Depends(get_current_user)):
    """Change current user's password"""
    if "password_hash" not in user:
        raise HTTPException(400, "User does not have a password set (OAuth user?)")
        
    from auth import verify_password, change_password, hash_password
    
    # Verify old password
    # Since we can't import verify_password here if it causes circular import, 
    # we might need to handle it carefully. 
    # Actually main.py imports auth.py, so it's fine.
    
    # Manual verification to avoid circular import issues if logical separation isn't perfect
    hashed_old = hash_password(req.old_password)
    if hashed_old != user["password_hash"]:
        raise HTTPException(400, "Incorrect old password")
        
    validation = validate_password_strength(req.new_password)
    if not validation["valid"]:
        raise HTTPException(400, str(validation["errors"]))
        
    await change_password(user["_id"], req.new_password)
    return {"status": "success"}

class Toggle2FARequest(BaseModel):
    enabled: bool

@app.post("/api/v1/auth/2fa/toggle")
async def api_toggle_2fa(req: Toggle2FARequest, user = Depends(get_current_user)):
    """Toggle 2FA"""
    from auth import toggle_two_factor
    await toggle_two_factor(user["_id"], req.enabled)
    return {"status": "success", "enabled": req.enabled}

@app.post("/api/v1/user/deactivate")
async def api_deactivate_account(user = Depends(get_current_user)):
    """Deactivate account"""
    from auth import deactivate_user
    await deactivate_user(user["_id"])
    return {"status": "deactivated"}

@app.delete("/api/v1/user")
async def api_delete_account(user = Depends(get_current_user)):
    """Permanently delete account"""
    from auth import delete_user
    await delete_user(user["_id"])
    return {"status": "deleted"}

@app.get("/api/v1/user/activity")
async def api_get_activity_log(user = Depends(get_current_user)):
    """Get recent account activity (mock for now or real if available)"""
    # In a real app, we'd query an audit log collection
    return [
        {"action": "Login", "date": datetime.now(timezone.utc).isoformat(), "details": "Successful login"},
        {"action": "Profile Update", "date": (datetime.now(timezone.utc) - timedelta(days=2)).isoformat(), "details": "Updated bio"}
    ]


# ==================== ALIAS SYSTEM ENDPOINTS ====================

@app.post("/api/v1/aliases/")
async def api_create_alias(alias_data: AliasCreate, user = Depends(get_current_user)):
    """Create a new alias for the current user"""
    try:
        alias = await create_alias(user["_id"], alias_data)
        return alias
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create alias: {str(e)}")

@app.get("/api/v1/aliases/")
async def api_get_aliases(user = Depends(get_current_user)):
    """Get all aliases for the current user"""
    try:
        aliases = await get_user_aliases(user["_id"])
        return {"aliases": aliases}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch aliases: {str(e)}")

@app.get("/api/v1/aliases/{alias_id}")
async def api_get_alias(alias_id: str, user = Depends(get_current_user)):
    """Get a specific alias by ID"""
    alias = await get_alias_by_id(alias_id)
    if not alias:
        raise HTTPException(status_code=404, detail="Alias not found")
    if alias["user_id"] != user["_id"]:
        raise HTTPException(status_code=403, detail="Not authorized to view this alias")
    return alias

@app.put("/api/v1/aliases/{alias_id}")
async def api_update_alias(alias_id: str, update_data: AliasUpdate, user = Depends(get_current_user)):
    """Update an alias"""
    try:
        alias = await update_alias(alias_id, user["_id"], update_data)
        return alias
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update alias: {str(e)}")

@app.delete("/api/v1/aliases/{alias_id}")
async def api_delete_alias(alias_id: str, user = Depends(get_current_user)):
    """Delete an alias"""
    try:
        success = await delete_alias(alias_id, user["_id"])
        if success:
            return {"status": "deleted"}
        raise HTTPException(status_code=404, detail="Alias not found")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete alias: {str(e)}")

@app.post("/api/v1/aliases/{alias_id}/activate")
async def api_activate_alias(alias_id: str, user = Depends(get_current_user)):
    """Activate an alias (switch to this persona)"""
    try:
        alias = await activate_alias(alias_id, user["_id"])
        return {"status": "activated", "alias": alias}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to activate alias: {str(e)}")

@app.post("/api/v1/aliases/deactivate")
async def api_deactivate_aliases(user = Depends(get_current_user)):
    """Deactivate all aliases and return to main profile"""
    try:
        success = await deactivate_all_aliases(user["_id"])
        return {"status": "deactivated"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to deactivate aliases: {str(e)}")

@app.get("/api/v1/aliases/active")
async def api_get_active_alias(user = Depends(get_current_user)):
    """Get the currently active alias (if any)"""
    alias = await get_active_alias(user["_id"])
    if alias:
        return alias
    return {"message": "No active alias"}





# --- AI ENDPOINTS ---

@app.post("/api/v1/ai/enhance-post")
async def api_enhance_post(req: EnhancePostRequest):
    """Enhances post content and title using Gemini AI."""
    result = await enhance_content(req.content, req.title)
    return result

@app.post("/api/v1/ai/sentiment")
async def api_get_sentiment(req: SentimentRequest):
    """Analyzes the sentiment of a given text."""
    sentiment = get_sentiment(req.text)
    return {"sentiment": sentiment}

@app.get("/api/v1/ai/post-summary/{post_id}")
async def api_get_post_summary(post_id: str):
    """Generates a summary for a specific post."""
    post = await posts_collection.find_one({"_id": ObjectId(post_id) if ObjectId.is_valid(post_id) else post_id})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    summary = summarize_text(post.get("content", ""))
    return {"summary": summary}

@app.post("/api/v1/ai/chat")
async def api_ai_chat(req: ChatRequest):
    """Interactive chat with Openly AI Assistant."""
    from ai_utils import model
    
    if not model:
        return {"response": "I'm currently offline. Please check your Gemini API key."}
    
    try:
        # Gemini expects a specific history format
        # We'll simplify for now and just send the message or use provided history
        chat = model.start_chat(history=req.history)
        response = chat.send_message(req.message)
        return {
            "response": response.text,
            "history": [
                *req.history,
                {"role": "user", "parts": [req.message]},
                {"role": "model", "parts": [response.text]}
            ]
        }
    except Exception as e:
        print(f"Gemini Chat Error: {e}")
        return {"response": "Oops! I encountered an error. Try again shortly."}

@app.get("/api/v1/hubs/{hub_name}/sentiment")
async def api_get_hub_sentiment(hub_name: str):
    """Analyzes the collective sentiment of recent posts in a hub."""
    # Find recent posts in this hub
    recent_posts = await posts_collection.find({"hubs": hub_name, "is_rejected": False}).sort("created_at", -1).to_list(10)
    
    if not recent_posts:
        return {"sentiment": "NEUTRAL", "score": 0.5, "post_count": 0}
    
    combined_text = " ".join([p.get("content", "") for p in recent_posts])
    sentiment = get_sentiment(combined_text)
    
    # Map sentiment to a score for the UI
    score_map = {"POSITIVE": 0.8, "NEGATIVE": 0.2, "NEUTRAL": 0.5}
    return {
        "hub": hub_name,
        "sentiment": sentiment,
        "score": score_map.get(sentiment, 0.5),
        "post_count": len(recent_posts)
    }

@app.get("/api/v1/search/semantic")
async def api_semantic_search(q: str = Query(...), category: Optional[str] = None):
    """Performs context-aware semantic search using Gemini to expand queries."""
    from ai_utils import model
    
    if not model:
        # Fallback to basic text search
        query = {"$text": {"$search": q}} if category is None else {"$text": {"$search": q}, "category": category}
        cursor = posts_collection.find(query).limit(20)
        return [serialize_doc(doc) for doc in await cursor.to_list(20)]
        
    try:
        # Step 1: Use Gemini to expand the query with related terms
        expansion_prompt = f"Given the search query '{q}', provide 5-10 related professional keywords or concepts. Respond ONLY with a comma-separated list."
        expansion_response = model.generate_content(expansion_prompt)
        expanded_terms = expansion_response.text.strip()
        
        # Step 2: Perform a text search with expanded terms
        # This is a simple implementation of semantic expansion
        search_query = f"{q} {expanded_terms}"
        mongo_query = {"$or": [
            {"content": {"$regex": q, "$options": "i"}},
            {"title": {"$regex": q, "$options": "i"}},
            {"tags": {"$in": [q]}}
        ]}
        
        if category and category != "All":
            mongo_query = {"$and": [mongo_query, {"category": category}]}
            
        cursor = posts_collection.find(mongo_query).sort("created_at", -1).limit(20)
        results = [serialize_doc(doc) for doc in await cursor.to_list(20)]
        
        return {
            "query": q,
            "expanded_terms": expanded_terms,
            "results": results
        }
    except Exception as e:
        print(f"Semantic Search Error: {e}")
        # Final fallback
        cursor = posts_collection.find({"content": {"$regex": q, "$options": "i"}}).limit(10)
        return {"results": [serialize_doc(doc) for doc in await cursor.to_list(10)]}

@app.get("/api/v1/ai/data/clusters")
async def api_get_tag_clusters():
    """Returns AI-grouped clusters of all existing tags."""
    # 1. Fetch all unique tags from all posts
    all_tags = await posts_collection.distinct("tags")
    if not all_tags:
        return {"Themes": {}, "Uncategorized": []}
        
    # 2. Use Gemini to cluster them
    clusters = await cluster_tags(all_tags)
    return clusters

@app.get("/api/v1/ai/data/posts-by-theme")
async def api_get_posts_by_theme():
    """Separates posts into data groups based on AI-generated themes."""
    # 1. Get clusters
    all_tags = await posts_collection.distinct("tags")
    clusters = await cluster_tags(all_tags)
    
    themes = clusters.get("Themes", {})
    grouped_data = {}
    
    for theme_name, tags in themes.items():
        # Find posts that have ANY of these tags
        cursor = posts_collection.find({"tags": {"$in": tags}, "is_rejected": False}).sort("created_at", -1).limit(50)
        posts = [serialize_doc(doc) for doc in await cursor.to_list(50)]
        grouped_data[theme_name] = posts
        
    return grouped_data


# --- POSTS ---

def assign_hub_from_category(category: str):
    if not category:
        return None
        
    hub_map = {
        "Technology": ["Tech", "Programming", "AI", "Software", "Hardware", "Technology"],
        "Business": ["Business", "Startup", "Marketing", "Sales", "Entrepreneurship"],
        "Medical": ["Health", "Medicine", "Medical", "Fitness", "Wellness"],
        "Education": ["Education", "Learning", "Teaching", "School", "University"],
        "Legal": ["Law", "Legal", "Justice", "Attorney"],
        "Finance": ["Finance", "Money", "Crypto", "Investing", "Trading", "Economics"],
        "Engineering": ["Engineering", "Civil", "Mechanical", "Electrical", "Architecture"],
        "Academic": ["Science", "Research", "Academic", "Physics", "Math", "Biology", "Chemistry"],
    }
    
    cat_lower = category.lower()
    for hub, keywords in hub_map.items():
        if any(kw.lower() in cat_lower for kw in keywords):
            return hub
    return None


async def check_global_settings(user_id: Optional[str] = None):
    settings = await settings_collection.find_one({"_id": "global_settings"})
    if not settings:
        return {}
        
    user = None
    if user_id:
        user = await get_user_by_any_id(user_id)
        # Admins bypass these restrictions
        if user and (user.get("role") == "admin" or user.get("username") == "admin"):
            return settings
            
    if settings.get("read_only_mode"):
        raise HTTPException(status_code=403, detail="Platform is currently in read-only mode")
        
    if settings.get("require_verified_email") and user and not user.get("email_verified", False):
        raise HTTPException(status_code=403, detail="Email verification required to perform this action")
        
    return settings


@app.post("/posts/")
async def create_post(post: PostRequest):
    await check_global_settings(post.user_id)
    
    if is_toxic(post.content):
        # Log rejected post
        await posts_collection.insert_one({
            "user_id": post.user_id,
            "content": post.content,
            "is_rejected": True,
            "created_at": datetime.now(timezone.utc).isoformat()
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
        "title": post.title,
        "category": post.category if post.category and post.category != "All" else classify_category(post.content),
        "tags": post.tags,
        "image_url": post.image_url,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "is_anonymous": post.is_anonymous,
        "is_professional_inquiry": post.is_professional_inquiry,
        "reaction_count": 0,
        "comment_count": 0,
        "endorsements_count": 0,
        "endorsements_by": [],
        "views_count": 0,
        "report_count": 0,
        "downvote_count": 0,
        "is_rejected": False,
        "timeline_id": post.timeline_id,
        "collaborators": post.collaborators,
        "is_archived": False,
        "hubs": post.hubs
    }

    if post.poll:
        try:
            new_post["poll"] = build_poll_doc(post.poll)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
            
    if post.community_id:
        new_post["community_id"] = post.community_id

    result = await posts_collection.insert_one(new_post)
    
    # GAMIFICATION: Award points for creating a post
    try:
        from gamification import calculate_score_action, get_badges_for_score
        points = calculate_score_action("post_creation")
        
        # Update user score
        user = await users_collection.find_one({"_id": ObjectId(post.user_id)})
        if user:
            current_score = user.get("phoenix_score", 0)
            new_score = current_score + points
            
            # Check for new badges
            new_badges = get_badges_for_score(new_score)
            existing_badges = user.get("badges", [])
            updated_badges = list(set(existing_badges + new_badges))
            
            await users_collection.update_one(
                {"_id": ObjectId(post.user_id)},
                {"$set": {"phoenix_score": new_score, "badges": updated_badges}}
            )
    except Exception as e:
        print(f"Error updating gamification score: {e}")
    
    # Invalidate feed caches for this category
    post_category = new_post["category"]
    await invalidate_category_cache(post_category)
    
    return {"id": str(result.inserted_id), "status": "posted"}

@app.get("/feed/")
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
        {"hubs": {"$exists": False}}
    ]

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
                posts_query = {"_id": {"$in": reco_post_ids}, "is_rejected": False, "is_archived": False}
                posts_query["$or"] = [
                    {"hub": {"$in": followed_hubs}},
                    {"hub": {"$exists": False}},
                    {"hub": None}
                ]
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
        # Hot Algorithm: Score = Log10(max(reactions, 1)) + (timestamp / 100000000)
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
    
    # Cache the feed (with appropriate TTL based on sort type)
    if sort_by != "for-you":
        cache_key = generate_cache_key(sort_by, category or "All", user_id)
        ttl = 15 if sort_by == "new" else 30  # New feeds are more volatile
        await set_cached_feed(cache_key, feed, ttl)
        
    return feed

@app.get("/api/v1/hubs/{industry}")
async def get_hub_posts(industry: str, limit: int = 20):
    """Fetch posts belonging to a specific industry hub."""
    # Convert 'technology' to 'Technology', etc.
    hub_name = industry.capitalize()
    
    query = {
        "is_rejected": False,
        "is_archived": False,
        "hubs": hub_name
    }
    
    cursor = posts_collection.find(query).sort("created_at", -1).limit(limit)
    posts = []
    async for post in cursor:
        posts.append(serialize_doc(post))
        
    return posts

@app.get("/posts/{post_id}")
async def get_post(post_id: str):
    try:
        oid = ObjectId(post_id)
    except:
        raise HTTPException(404, "Post not found")

    doc = await posts_collection.find_one({"_id": oid, "is_archived": False})
    if not doc:
        raise HTTPException(404, "Post not found")
    return serialize_doc(doc)

@app.get("/posts/{post_id}/related")
async def get_related_posts(post_id: str, limit: int = 4):
    try:
        oid = ObjectId(post_id)
    except:
        raise HTTPException(400, "Invalid post ID")
        
    post = await posts_collection.find_one({"_id": oid})
    if not post:
        raise HTTPException(404, "Post not found")
        
    query = {
        "_id": {"$ne": oid},
        "is_rejected": False,
        "is_archived": False,
        "is_anonymous": False,
        "$or": [
            {"category": post.get("category")},
            {"tags": {"$in": post.get("tags", [])}}
        ]
    }
    
    # Sort by reaction_count to surface "hot" related posts
    cursor = posts_collection.find(query).sort("reaction_count", -1).limit(limit)
    feed = []
    
    async for doc in cursor:
        data = serialize_doc(doc)
        if data.get("user_id"):
            u_info = await users_collection.find_one({"_id": data["user_id"]})
            if u_info:
                data["user_name"] = u_info.get("display_name") or u_info.get("username") or data["user_name"]
                data["user_pic"] = u_info.get("photoURL") or data["user_pic"]
                data["username"] = "@" + u_info.get("username", "user")
        feed.append(data)
        
    return feed

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
    return {"status": "deleted"}


# ─── POST EDITING ───────────────────────────────────────────────────────────

class PostEditRequest(BaseModel):
    user_id: str
    content: Optional[str] = None
    title: Optional[str] = None

@app.patch("/posts/{post_id}")
async def edit_post(post_id: str, req: PostEditRequest):
    try:
        oid = ObjectId(post_id)
    except:
        raise HTTPException(400, "Invalid post ID")
    post = await posts_collection.find_one({"_id": oid})
    if not post:
        raise HTTPException(404, "Post not found")
    if post.get("user_id") != req.user_id:
        raise HTTPException(403, "Permission denied")

    updates: dict = {"edited_at": datetime.now(timezone.utc).isoformat()}
    if req.content is not None:
        updates["content"] = req.content
    if req.title is not None:
        updates["title"] = req.title

    await posts_collection.update_one({"_id": oid}, {"$set": updates})
    return {"status": "edited"}


# ─── POST INSIGHTS ───────────────────────────────────────────────────────────

@app.get("/posts/{post_id}/insights")
async def get_post_insights(post_id: str, user_id: str):
    try:
        oid = ObjectId(post_id)
    except:
        raise HTTPException(400, "Invalid post ID")
    post = await posts_collection.find_one({"_id": oid})
    if not post:
        raise HTTPException(404, "Post not found")
    if post.get("user_id") != user_id:
        raise HTTPException(403, "Not your post")

    comments_count = await comments_collection.count_documents({"post_id": post_id})
    reactions_count = await reactions_collection.count_documents({"post_id": post_id})
    bookmarks_count = await bookmarks_collection.count_documents({"post_id": post_id})
    downvotes_count = await downvotes_collection.count_documents({"post_id": post_id})

    return {
        "views": post.get("view_count", 0),
        "reactions": reactions_count,
        "downvotes": downvotes_count,
        "comments": comments_count,
        "bookmarks": bookmarks_count,
        "created_at": post.get("created_at"),
        "edited_at": post.get("edited_at"),
    }


# ─── ADMIN DASHBOARD ──────────────────────────────────────────────────────────

@app.get("/admin/stats")
async def get_admin_stats(user_id: str):
    # Security: check if user is admin
    user = await get_user_by_any_id(user_id)
    if not user or user.get("role") != "admin":
        # Check backward compatibility just in case
        if not user or user.get("username") != "admin":
            raise HTTPException(status_code=403, detail="Admin access required")

    total_users = await users_collection.count_documents({})
    total_posts = await posts_collection.count_documents({})
    flagged_posts = await posts_collection.count_documents({"is_flagged": True})
    total_reports = await reports_collection.count_documents({})
    
    # We could also get community count if we imported communities_collection, let's keep it simple
    return {
        "total_users": total_users,
        "total_posts": total_posts,
        "flagged_posts": flagged_posts,
        "total_reports": total_reports
    }

@app.get("/admin/users")
async def get_all_users_admin(user_id: str, skip: int = 0, limit: int = 50):
    user = await get_user_by_any_id(user_id)
    if not user or (user.get("role") != "admin" and user.get("username") != "admin"):
        raise HTTPException(status_code=403, detail="Admin access required")
        
    cursor = users_collection.find().skip(skip).limit(limit)
    users = []
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        uid = doc.get("uid") or doc["_id"]
        users.append({
            "id": str(doc["_id"]),
            "uid": uid,
            "username": doc.get("username", ""),
            "display_name": doc.get("display_name", ""),
            "email": doc.get("email", ""),
            "role": doc.get("role", "user"),
            "is_banned": doc.get("is_banned", False),
            "created_at": doc.get("created_at")
        })
    
    total = await users_collection.count_documents({})
    return {"users": users, "total": total}

@app.patch("/admin/users/{target_id}/role")
async def update_user_role(target_id: str, new_role: str, admin_id: str = Query(...)):
    admin = await get_user_by_any_id(admin_id)
    if not admin or (admin.get("role") != "admin" and admin.get("username") != "admin"):
        raise HTTPException(status_code=403, detail="Admin access required")
        
    if new_role not in ["user", "expert", "admin"]:
        raise HTTPException(status_code=400, detail="Invalid role")
        
    obj_id = ObjectId(target_id) if len(target_id) == 24 else None
    query = {"$or": [{"uid": target_id}, {"_id": obj_id}]} if obj_id else {"uid": target_id}
    
    result = await users_collection.update_one(query, {"$set": {"role": new_role}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
        
    return {"status": "success", "new_role": new_role}

@app.patch("/admin/users/{target_id}/ban")
async def toggle_user_ban(target_id: str, admin_id: str = Query(...)):
    admin = await get_user_by_any_id(admin_id)
    if not admin or (admin.get("role") != "admin" and admin.get("username") != "admin"):
        raise HTTPException(status_code=403, detail="Admin access required")
        
    obj_id = ObjectId(target_id) if len(target_id) == 24 else None
    query = {"$or": [{"uid": target_id}, {"_id": obj_id}]} if obj_id else {"uid": target_id}
    
    target_user = await users_collection.find_one(query)
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    current_status = target_user.get("is_banned", False)
    new_status = not current_status
    
    await users_collection.update_one(query, {"$set": {"is_banned": new_status}})
    return {"status": "success", "is_banned": new_status}

@app.patch("/admin/posts/{post_id}/unflag")
async def unflag_post(post_id: str, admin_id: str = Query(...)):
    admin = await get_user_by_any_id(admin_id)
    if not admin or (admin.get("role") != "admin" and admin.get("username") != "admin"):
        raise HTTPException(status_code=403, detail="Admin access required")
        
    try:
        oid = ObjectId(post_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid post ID")
        
    result = await posts_collection.update_one(
        {"_id": oid}, 
        {"$set": {"is_flagged": False, "is_rejected": False}, "$set": {"report_count": 0}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Post not found")
        
    return {"status": "success", "message": "Post unflagged and approved"}


# ─── SYSTEM SETTINGS ──────────────────────────────────────────────────────────

class SystemSettingsUpdate(BaseModel):
    maintenance_mode: Optional[bool] = None
    broadcast_message: Optional[str] = None
    read_only_mode: Optional[bool] = None
    pause_registrations: Optional[bool] = None
    disable_dms: Optional[bool] = None
    require_verified_email: Optional[bool] = None

@app.get("/api/v1/system/settings")
async def get_system_settings():
    settings = await settings_collection.find_one({"_id": "global_settings"})
    if not settings:
        return {
            "maintenance_mode": False, 
            "broadcast_message": "",
            "read_only_mode": False,
            "pause_registrations": False,
            "disable_dms": False,
            "require_verified_email": False
        }
    
    return {
        "maintenance_mode": settings.get("maintenance_mode", False),
        "broadcast_message": settings.get("broadcast_message", ""),
        "read_only_mode": settings.get("read_only_mode", False),
        "pause_registrations": settings.get("pause_registrations", False),
        "disable_dms": settings.get("disable_dms", False),
        "require_verified_email": settings.get("require_verified_email", False),
    }

@app.patch("/admin/system/settings")
async def update_system_settings(updates: SystemSettingsUpdate, admin_id: str = Query(...)):
    admin = await get_user_by_any_id(admin_id)
    if not admin or (admin.get("role") != "admin" and admin.get("username") != "admin"):
        raise HTTPException(status_code=403, detail="Admin access required")
        
    update_data = {}
    if updates.maintenance_mode is not None:
        update_data["maintenance_mode"] = updates.maintenance_mode
    if updates.broadcast_message is not None:
        update_data["broadcast_message"] = updates.broadcast_message
    if updates.read_only_mode is not None:
        update_data["read_only_mode"] = updates.read_only_mode
    if updates.pause_registrations is not None:
        update_data["pause_registrations"] = updates.pause_registrations
    if updates.disable_dms is not None:
        update_data["disable_dms"] = updates.disable_dms
    if updates.require_verified_email is not None:
        update_data["require_verified_email"] = updates.require_verified_email
        
    if update_data:
        await settings_collection.update_one(
            {"_id": "global_settings"},
            {"$set": update_data},
            upsert=True
        )
        
    return {"status": "success", "updated": update_data}


# ─── HASHTAG FEED ────────────────────────────────────────────────────────────

@app.get("/tags/{tag}/posts")
async def get_posts_by_tag(tag: str, sort_by: str = "new", limit: int = 50):
    tag_clean = tag.lstrip("#").lower()
    query = {"tags": {"$elemMatch": {"$regex": f"^{tag_clean}$", "$options": "i"}},
             "is_rejected": False, "is_archived": False}
    if sort_by == "hot":
        cursor = posts_collection.find(query).sort("reaction_count", -1).limit(limit)
    elif sort_by == "top":
        cursor = posts_collection.find(query).sort("view_count", -1).limit(limit)
    else:
        cursor = posts_collection.find(query).sort("created_at", -1).limit(limit)

    posts = []
    async for doc in cursor:
        posts.append(serialize_doc(doc))
    return posts


@app.get("/users/suggested")
async def get_suggested_users(user_id: Optional[str] = None, limit: int = 7):
    """
    Returns suggested users to follow.
    Hub-sharing users appear first, then other users.
    Only returns real registered users. Caps at `limit` (default 7).
    """
    # Build exclusion set: current user + already-connected users
    excluded_ids = set()
    current_user_hubs = []

    if user_id:
        excluded_ids.add(user_id)
        try:
            current_user = await get_user_by_any_id(user_id)
            if current_user:
                current_user_hubs = current_user.get("followed_hubs", [])
        except Exception:
            pass

        # Exclude users already connected/followed
        try:
            connections_cursor = connections_collection.find({
                "$or": [{"requester_id": user_id}, {"target_id": user_id}],
                "status": {"$in": ["accepted", "pending"]}
            })
            async for conn in connections_cursor:
                excluded_ids.add(conn.get("requester_id"))
                excluded_ids.add(conn.get("target_id"))
        except Exception:
            pass

    # Fetch all real users (exclude bots/anonymous, cap fetch at 100)
    query = {"username": {"$exists": True, "$ne": None, "$ne": ""}}
    all_users_cursor = users_collection.find(query, {
        "_id": 1, "uid": 1, "username": 1, "display_name": 1,
        "photoURL": 1, "followed_hubs": 1, "phoenix_score": 1
    }).limit(100)

    hub_users = []
    normal_users = []
    seen_uids = set()  # Track seen UIDs to prevent duplicates

    async for u in all_users_cursor:
        uid = u.get("uid") or str(u["_id"])
        if not uid or uid in excluded_ids or uid in seen_uids:
            continue
        seen_uids.add(uid)

        user_data = {
            "uid": uid,
            "username": u.get("username", ""),
            "display_name": u.get("display_name", u.get("username", "")),
            "photoURL": u.get("photoURL"),
            "phoenix_score": u.get("phoenix_score", 0)
        }

        # Sort: hub-sharing users first
        user_hubs = u.get("followed_hubs", [])
        if current_user_hubs and any(h in current_user_hubs for h in user_hubs):
            hub_users.append(user_data)
        else:
            normal_users.append(user_data)

    # Merge: hub-users first, then normal users, cap at limit
    suggestions = (hub_users + normal_users)[:limit]
    return suggestions


# ─── TRENDING ────────────────────────────────────────────────────────────────

@app.get("/api/v1/trending/posts")
async def get_trending_posts(limit: int = 5):
    """
    Returns top trending posts using the Hot Algorithm.
    """
    query = {"is_rejected": False, "is_archived": False}
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
                        {"$divide": ["$ts", 100000000]} 
                    ]
                }
            }
        },
        {"$sort": {"hot_score": -1}},
        {"$limit": limit}
    ]
    cursor = posts_collection.aggregate(pipeline)
    results = []
    async for doc in cursor:
        results.append(serialize_doc(doc))
    return results

@app.get("/api/v1/trending/tags")
async def get_trending_tags(limit: int = 5):
    """
    Returns top trending tags based on recent post counts.
    """
    # Look at posts from the last 7 days
    seven_days_ago = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
    
    pipeline = [
        {"$match": {"created_at": {"$gte": seven_days_ago}, "is_rejected": False}},
        {"$unwind": "$tags"},
        {"$group": {
            "_id": "$tags",
            "count": {"$sum": 1},
            "latest": {"$max": "$created_at"}
        }},
        {"$sort": {"count": -1, "latest": -1}},
        {"$limit": limit}
    ]
    
    cursor = posts_collection.aggregate(pipeline)
    results = []
    async for doc in cursor:
        results.append({
            "tag": doc["_id"],
            "count": doc["count"]
        })
    return results

@app.get("/api/v1/posts/{post_id}/summarize")
async def api_summarize_post(post_id: str):
    """
    Generates an AI summary for a post.
    """
    try:
        oid = ObjectId(post_id)
    except:
        raise HTTPException(400, "Invalid post ID")
        
    post = await posts_collection.find_one({"_id": oid})
    if not post:
        raise HTTPException(404, "Post not found")
        
    summary = summarize_text(post["content"])
    return {"summary": summary}

@app.get("/api/v1/posts/suggest-tags")
async def suggest_tags(content: str = Query(..., min_length=10)):
    """
    Suggests tags based on the provided content.
    """
    tags = extract_keywords(content)
    return {"tags": tags}

@app.post("/api/v1/posts/{post_id}/endorse")
async def endorse_post(post_id: str, user_id: str = Query(...)):
    """
    Allows professionals to endorse a post for its insight.
    """
    try:
        oid = ObjectId(post_id)
    except:
        raise HTTPException(400, "Invalid post ID")
        
    post = await posts_collection.find_one({"_id": oid})
    if not post:
        raise HTTPException(404, "Post not found")
        
    # Check if user is expert (optional: could check profile info)
    # For now, we allow anyone but track it as endorsement
    if user_id in post.get("endorsements_by", []):
        return {"msg": "Already endorsed", "endorsements_count": post.get("endorsements_count", 0)}
        
    await posts_collection.update_one(
        {"_id": oid},
        {
            "$inc": {"endorsements_count": 1},
            "$push": {"endorsements_by": user_id}
        }
    )
    return {"msg": "Post endorsed", "endorsements_count": post.get("endorsements_count", 0) + 1}

@app.get("/api/v1/hubs/{industry}")
async def get_hub_posts(industry: str, limit: int = 10, offset: int = 0):
    """
    Returns posts filtered by a professional industry hub.
    """
    # Simply using category for now, or we could use tags
    query = {
        "is_rejected": False, 
        "is_archived": False,
        "$or": [
            {"category": industry.capitalize()},
            {"tags": industry.lower()}
        ]
    }
    cursor = posts_collection.find(query).sort("created_at", -1).skip(offset).limit(limit)
    results = []
    async for doc in cursor:
        results.append(serialize_doc(doc))
    return results


# ─── CONTENT WARNINGS ────────────────────────────────────────────────────────

class ContentWarningRequest(BaseModel):
    user_id: str
    content_warning: Optional[str] = None  # None to remove

@app.patch("/posts/{post_id}/content-warning")
async def set_content_warning(post_id: str, req: ContentWarningRequest):
    try:
        oid = ObjectId(post_id)
    except:
        raise HTTPException(400, "Invalid post ID")
    post = await posts_collection.find_one({"_id": oid})
    if not post:
        raise HTTPException(404, "Post not found")
    if post.get("user_id") != req.user_id:
        raise HTTPException(403, "Permission denied")

    await posts_collection.update_one(
        {"_id": oid},
        {"$set": {"content_warning": req.content_warning}}
    )
    return {"status": "updated", "content_warning": req.content_warning}


# ─── BLOCK / MUTE SYSTEM ─────────────────────────────────────────────────────

from database import blocks_collection, mutes_collection

class BlockMuteRequest(BaseModel):
    user_id: str  # the actor

@app.post("/users/{target_id}/block")
async def block_user(target_id: str, req: BlockMuteRequest):
    if req.user_id == target_id:
        raise HTTPException(400, "Cannot block self")
    await blocks_collection.update_one(
        {"blocker_id": req.user_id, "blocked_id": target_id},
        {"$set": {"blocker_id": req.user_id, "blocked_id": target_id,
                  "created_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True
    )
    return {"status": "blocked"}

@app.delete("/users/{target_id}/block")
async def unblock_user(target_id: str, user_id: str):
    await blocks_collection.delete_one({"blocker_id": user_id, "blocked_id": target_id})
    return {"status": "unblocked"}

@app.post("/users/{target_id}/mute")
async def mute_user(target_id: str, req: BlockMuteRequest):
    if req.user_id == target_id:
        raise HTTPException(400, "Cannot mute self")
    await mutes_collection.update_one(
        {"muter_id": req.user_id, "muted_id": target_id},
        {"$set": {"muter_id": req.user_id, "muted_id": target_id,
                  "created_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True
    )
    return {"status": "muted"}

@app.delete("/users/{target_id}/mute")
async def unmute_user(target_id: str, user_id: str):
    await mutes_collection.delete_one({"muter_id": user_id, "muted_id": target_id})
    return {"status": "unmuted"}

@app.get("/users/{user_id}/blocked")
async def get_blocked_users(user_id: str):
    cursor = blocks_collection.find({"blocker_id": user_id})
    results = []
    async for doc in cursor:
        target = await get_user_by_any_id(doc["blocked_id"])
        if target:
            results.append({
                "user_id": doc["blocked_id"],
                "username": target.get("username", ""),
                "display_name": target.get("display_name") or target.get("username", "User"),
                "photoURL": target.get("photoURL")
            })
    return results


# --- REPORTS ---

@app.post("/reports/")
async def create_report(report: ReportRequest):
    new_report = {
        "reporter_id": report.reporter_id,
        "target_id": report.target_id,
        "target_type": report.target_type,
        "reason": report.reason,
        "details": report.details,
        "created_at": datetime.now(timezone.utc).isoformat(),
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
async def search_mixed(
    q: str = Query(..., min_length=3), 
    user_id: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    exclude_topics: Optional[str] = None
):
    q_str = q.lower()
    regex = {"$regex": q_str, "$options": "i"} # options i = case insensitive

    results = []

    # 1. SEARCH USERS
    # Find users where username OR display_name matches
    user_query = {
        "$or": [
            {"username": regex},
            {"display_name": regex}
        ]
    }
    user_cursor = users_collection.find(user_query)
    async for doc in user_cursor:
        data = serialize_doc(doc)
        
        # Check if following
        is_following = False
        if user_id:
            follow_doc = await follows_collection.find_one({
                "follower_id": user_id,
                "following_id": data["id"]
            })
            if follow_doc:
                is_following = True

        # user_id is the _id
        results.append({
            "type": "user",
            "id": data["id"], 
            "username": data.get("username"),
            "user_pic": data.get("photoURL"), 
            "display_name": data.get("display_name"),
            "is_following": is_following
        })

    # 2. SEARCH POSTS
    # Search in content, tags, category, username
    post_query = {
        "is_rejected": False,
        "is_archived": False,
        "$or": [
            {"content": regex},
            {"tags": regex},
            {"category": regex},
            {"username": regex}
        ]
    }
    
    if start_date or end_date:
        post_query["created_at"] = {}
        if start_date:
            post_query["created_at"]["$gte"] = start_date
        if end_date:
            post_query["created_at"]["$lte"] = end_date
            
    if exclude_topics:
        excluded = [re.compile(re.escape(t.strip()), re.IGNORECASE) for t in exclude_topics.split(",")]
        post_query["category"] = {"$nin": excluded}
        post_query["tags"] = {"$nin": excluded}
    
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
async def get_user_profile_v2(user_id: str, requester_id: Optional[str] = None):
    # Fetch user data (user_id is _id or uid)
    user_data = await get_user_by_any_id(user_id)
    if not user_data:
        raise HTTPException(404, "User not found")

    # Check if requester follows this user (check both id and uid formats)
    is_following = False
    follow_status = "not_following"
    if requester_id:
        # Build list of all possible IDs this user might be stored under
        target_all_ids = [str(user_data["_id"])]
        if user_data.get("uid"):
            target_all_ids.append(user_data["uid"])

        follow_record = await follows_collection.find_one({
            "follower_id": requester_id,
            "following_id": {"$in": target_all_ids}
        })
        if follow_record:
            follow_status = follow_record.get("status", "accepted")
            is_following = follow_status == "accepted"

    # Fetch posts
    cursor = posts_collection.find({"user_id": user_id}).sort("created_at", -1)
    
    user_posts = []
    total_views = 0
    total_posts = 0
    
    # Determine the best photoURL
    best_photo_url = user_data.get("photoURL")
    
    async for doc in cursor:
        data = serialize_doc(doc)
        
        # 🛠️ DYNAMIC PROFILE UPDATE (Keep it fresh)
        if not data.get("is_anonymous", False):
            data["user_name"] = user_data.get("display_name") or user_data.get("username") or data["user_name"]
            data["user_pic"] = user_data.get("photoURL") or data["user_pic"]
            data["username"] = "@" + user_data.get("username", "user")
            
            # Legacy fallback: If the user has no photoURL but one of their posts does, use it
            if not best_photo_url and data.get("user_pic") and "/assets/default" not in data.get("user_pic"):
                best_photo_url = data["user_pic"]

        total_views += data.get("view_count", 0)
        total_posts += 1
        user_posts.append(data)
    
    # Build list of IDs for this user (both MongoDB _id string and Firebase uid)
    user_ids_list = [str(user_data["_id"])]
    if user_data.get("uid"):
        user_ids_list.append(user_data["uid"])

    # Count unique followers and following (group by user ID to avoid counting duplicates)
    accepted_cond = {"$or": [{"status": "accepted"}, {"status": {"$exists": False}}]}

    followers_pipeline = [
        {"$match": {"following_id": {"$in": user_ids_list}, **accepted_cond}},
        {"$group": {"_id": "$follower_id"}},
        {"$count": "total"}
    ]
    following_pipeline = [
        {"$match": {"follower_id": {"$in": user_ids_list}, **accepted_cond}},
        {"$group": {"_id": "$following_id"}},
        {"$count": "total"}
    ]

    followers_res = await follows_collection.aggregate(followers_pipeline).to_list(1)
    following_res = await follows_collection.aggregate(following_pipeline).to_list(1)
    followers_count = followers_res[0]["total"] if followers_res else 0
    following_count = following_res[0]["total"] if following_res else 0

    return {
        "user_info": {
            "id": str(user_data.get("_id")),
            "username": user_data.get("username", None),
            "display_name": user_data.get("display_name", "Anonymous"),
            "photoURL": best_photo_url,
            "role": user_data.get("role", "user"),
            "is_banned": user_data.get("is_banned", False),
            "headline": user_data.get("headline", None),
            "bio": user_data.get("bio", None),
            "website": user_data.get("website", None),
            "location": user_data.get("location", None),
            "experiences": user_data.get("experiences", []),
            "education": user_data.get("education", []),
            "skills": user_data.get("skills", []),
            "phoenix_score": user_data.get("phoenix_score", 0),
            "badges": user_data.get("badges", []),
            "is_following": is_following,
            "follow_status": follow_status,
            "followed_hubs": user_data.get("followed_hubs", [])
        },
        "stats": {
            "total_views": total_views,
            "total_posts": total_posts,
            "followers": followers_count,
            "following": following_count
        },
        "posts": user_posts
    }

@app.post("/users/{user_id}/insights/send")
async def send_weekly_insights(user_id: str):
    user = await get_user_by_any_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    user_name = user.get("display_name") or user.get("username") or "User"
    email = user.get("email") or "user@example.com"
    
    try:
        result = await send_insight_report(str(user["_id"]), email, user_name)
        return result
    except Exception as e:
        print(f"[ERROR] Failed to send insights: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/users/{user_id}/hubs/{hub_name}/join")
async def join_hub(user_id: str, hub_name: str):
    user = await get_user_by_any_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    await users_collection.update_one(
        {"_id": user["_id"]},
        {"$addToSet": {"followed_hubs": hub_name}}
    )
    return {"status": "success", "hub": hub_name}

@app.post("/users/{user_id}/hubs/{hub_name}/leave")
async def leave_hub(user_id: str, hub_name: str):
    user = await get_user_by_any_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    await users_collection.update_one(
        {"_id": user["_id"]},
        {"$pull": {"followed_hubs": hub_name}}
    )
    return {"status": "success", "hub": hub_name}

@app.post("/users/profile/photo")
async def upload_profile_photo(user_id: str, file: UploadFile = File(...)):
    # Validate file type
    if not file.content_type.startswith("image/"):
        raise HTTPException(400, "Only images allowed")
    
    # Ensure user exists
    user = await get_user_by_any_id(user_id)
    if not user:
        raise HTTPException(404, "User not found")

    try:
        # Upload to Cloudinary
        file_content = await file.read()
        result = cloudinary.uploader.upload(
            file_content,
            folder="profile_photos",
            resource_type="auto"
        )
        photo_url = result.get("secure_url")
        
        if not photo_url:
            raise Exception("Failed to get secure URL from Cloudinary")

        # Update DB
        await users_collection.update_one(
            {"_id": user_id},
            {"$set": {"photoURL": photo_url}}
        )

        # Propagate to all posts by this user
        await posts_collection.update_many(
            {"user_id": user_id},
            {"$set": {"user_pic": photo_url}}
        )

        return {"status": "success", "photoURL": photo_url}
    except Exception as e:
        print(f"[ERROR] Profile photo upload failed: {e}")
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

# Removed duplicate upload_image (using unified endpoint at line 169)

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
            "updated_at": datetime.now(timezone.utc).isoformat()
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
    display_name: Optional[str] = None
    username: Optional[str] = None
    # Professional fields
    profession: Optional[str] = None
    experiences: Optional[List[ProfessionalExperience]] = None
    education: Optional[List[Education]] = None
    skills: Optional[List[Skill]] = None

class StoryCreate(BaseModel):
    user_id: str
    content: Optional[str] = None
    image_url: Optional[str] = None
    background_color: Optional[str] = None

class ReactionCreate(BaseModel):
    user_id: str
    type: str # e.g. 'like', 'laugh', 'insightful', 'clap'


@app.post("/users/profile/update")
async def update_profile(req: ProfileUpdateRequest):
    update_data = {}
    if req.display_name is not None: update_data["display_name"] = req.display_name
    if req.username is not None: 
        username = req.username.strip().lower()
        if len(username) >= 3 and " " not in username:
            # Check if username is taken
            existing = await users_collection.find_one({"username": username})
            if not existing or str(existing["_id"]) == req.user_id or existing.get("uid") == req.user_id:
                update_data["username"] = username
            else:
                raise HTTPException(400, "Username is already taken")
        else:
            raise HTTPException(400, "Username must be at least 3 characters and contain no spaces")
    
    if req.headline is not None: update_data["headline"] = req.headline
    if req.bio is not None: update_data["bio"] = req.bio
    if req.website is not None: update_data["website"] = req.website
    if req.location is not None: update_data["location"] = req.location
    
    if not update_data:
        return {"status": "no_changes"}

    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
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

    # Unique View Check
    if req.user_id != "guest":
        existing_view = await views_collection.find_one({
            "post_id": post_id,
            "user_id": req.user_id
        })
        if existing_view:
            return {"status": "already_viewed"}
        
        # Record View
        await views_collection.insert_one({
            "post_id": post_id,
            "user_id": req.user_id,
            "ts": datetime.now(timezone.utc).isoformat()
        })

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
        # Remove Upvote
        await reactions_collection.delete_one({"_id": reaction["_id"]})
        await posts_collection.update_one({"_id": oid}, {"$inc": {"reaction_count": -1}})
        status = "removed"
    else:
        # Check if Downvoted first -> Remove Downvote if exists (Mutual Exclusivity)
        downvote = await downvotes_collection.find_one({
            "post_id": post_id,
            "user_id": req.user_id
        })
        if downvote:
            await downvotes_collection.delete_one({"_id": downvote["_id"]})
            await posts_collection.update_one({"_id": oid}, {"$inc": {"downvote_count": -1}})

        # Add Upvote
        await reactions_collection.insert_one({
            "post_id": post_id,
            "user_id": req.user_id,
            "ts": datetime.now(timezone.utc).isoformat()
        })
        await posts_collection.update_one({"_id": oid}, {"$inc": {"reaction_count": 1}})
        status = "added"

    return {"status": status}

@app.post("/posts/{post_id}/downvote")
async def toggle_downvote(post_id: str, req: ViewRequest):
    try:
        oid = ObjectId(post_id)
    except:
        raise HTTPException(404, "Post not found")

    # Check if downvote exists
    downvote = await downvotes_collection.find_one({
        "post_id": post_id,
        "user_id": req.user_id
    })

    if downvote:
        # Remove Downvote
        await downvotes_collection.delete_one({"_id": downvote["_id"]})
        await posts_collection.update_one({"_id": oid}, {"$inc": {"downvote_count": -1}})
        status = "removed"
    else:
        # Check if Upvoted first -> Remove Upvote if exists (Mutual Exclusivity)
        reaction = await reactions_collection.find_one({
            "post_id": post_id,
            "user_id": req.user_id
        })
        if reaction:
             await reactions_collection.delete_one({"_id": reaction["_id"]})
             await posts_collection.update_one({"_id": oid}, {"$inc": {"reaction_count": -1}})

        # Add Downvote
        await downvotes_collection.insert_one({
            "post_id": post_id,
            "user_id": req.user_id,
            "ts": datetime.now(timezone.utc).isoformat()
        })
        await posts_collection.update_one({"_id": oid}, {"$inc": {"downvote_count": 1, "reaction_count": 0}}, upsert=True) # Ensure downvote field exists
        status = "added"

    return {"status": status}

class PollVoteRequest(BaseModel):
    user_id: str
    option_id: str

@app.post("/posts/{post_id}/poll/vote")
async def vote_on_poll(post_id: str, payload: PollVoteRequest):
    try:
        updated_poll = await cast_vote(post_id, payload.option_id, payload.user_id)
        return {"message": "Vote cast", "poll": updated_poll}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

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
            "ts": datetime.now(timezone.utc).isoformat()
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
    await check_global_settings(comment.user_id)
    
    await comments_collection.insert_one({
        "post_id": post_id,
        "content": comment.content,
        "user_id": comment.user_id,
        "user_name": comment.user_name,
        "user_pic": comment.user_pic,
        "parent_id": comment.parent_id,
        "created_at": datetime.now(timezone.utc).isoformat()
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
        "created_at": datetime.now(timezone.utc).isoformat()
    })

@app.get("/notifications")
async def get_notifications(user_id: str):
    cursor = notifications_collection.find({"user_id": user_id}).sort("created_at", -1).limit(50)
    
    notifications = []
    async for doc in cursor:
        actor = await get_user_by_any_id(doc["actor_id"])
        notifications.append({
            "id": str(doc["_id"]),
            "type": doc["type"],
            "actor_name": actor.get("display_name", "Someone") if actor else "Someone",
            "actor_username": actor.get("username", "") if actor else "",
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

# --- FOLLOW SYSTEM (Request → Approval) ---

from database import follows_collection

class FollowRequestModel(BaseModel):
    user_id: str  # the requester

@app.post("/users/{target_id}/follow")
async def send_follow_request(target_id: str, req: FollowRequestModel):
    """Follow a user. Immediately sets status to accepted (open follow model)."""
    if req.user_id == target_id:
        raise HTTPException(400, "Cannot follow self")

    target = await get_user_by_any_id(target_id)
    if not target:
        raise HTTPException(404, "User not found")

    # Resolve both possible IDs for the target
    target_ids = [str(target["_id"])]
    if target.get("uid"):
        target_ids.append(target["uid"])

    # Check if already following
    existing = await follows_collection.find_one({
        "follower_id": req.user_id,
        "following_id": {"$in": target_ids}
    })
    if existing:
        status = existing.get("status", "accepted")
        if status != "accepted":
            # Upgrade pending to accepted
            await follows_collection.update_one(
                {"_id": existing["_id"]},
                {"$set": {"status": "accepted"}}
            )
        return {"status": "accepted"}

    # Use canonical uid if available, else MongoDB _id string
    canonical_target_id = target.get("uid") or str(target["_id"])

    # Create accepted follow immediately
    await follows_collection.insert_one({
        "follower_id": req.user_id,
        "following_id": canonical_target_id,
        "status": "accepted",
        "created_at": datetime.now(timezone.utc).isoformat()
    })

    return {"status": "accepted"}


@app.delete("/users/{target_id}/follow")
async def unfollow_user(target_id: str, user_id: str):
    """Unfollow a user — deletes any follow record by any ID format."""
    target = await get_user_by_any_id(target_id)
    if target:
        target_ids = [str(target["_id"])]
        if target.get("uid"):
            target_ids.append(target["uid"])
        await follows_collection.delete_many({
            "follower_id": user_id,
            "following_id": {"$in": target_ids}
        })
    else:
        await follows_collection.delete_many({
            "follower_id": user_id,
            "following_id": target_id
        })
    return {"status": "unfollowed"}


@app.get("/users/{user_id}/follow-requests")
async def get_follow_requests(user_id: str):
    """Get all pending follow requests for a user (i.e. people wanting to follow them)."""
    cursor = follows_collection.find({
        "following_id": user_id,
        "status": "pending"
    }).sort("created_at", -1)

    requests = []
    async for doc in cursor:
        requester = await get_user_by_any_id(doc["follower_id"])
        if requester:
            requests.append({
                "id": str(doc["_id"]),
                "requester_id": doc["follower_id"],
                "requester_name": requester.get("display_name") or requester.get("username", "User"),
                "requester_username": requester.get("username", ""),
                "requester_pic": requester.get("photoURL"),
                "created_at": doc["created_at"]
            })
    return requests


@app.post("/users/follow-requests/{request_id}/accept")
async def accept_follow_request(request_id: str, user_id: str):
    """Accept a follow request. The user_id must be the target (receiver)."""
    try:
        oid = ObjectId(request_id)
    except:
        raise HTTPException(400, "Invalid request ID")

    doc = await follows_collection.find_one({"_id": oid, "following_id": user_id, "status": "pending"})
    if not doc:
        raise HTTPException(404, "Follow request not found")

    await follows_collection.update_one(
        {"_id": oid},
        {"$set": {"status": "accepted", "accepted_at": datetime.now(timezone.utc).isoformat()}}
    )

    # Notify the requester their request was accepted
    await create_notification(doc["follower_id"], "follow_accepted", user_id,
                              message="accepted your follow request")

    return {"status": "accepted"}


@app.post("/users/follow-requests/{request_id}/reject")
async def reject_follow_request(request_id: str, user_id: str):
    """Reject (delete) a follow request."""
    try:
        oid = ObjectId(request_id)
    except:
        raise HTTPException(400, "Invalid request ID")

    result = await follows_collection.delete_one({"_id": oid, "following_id": user_id, "status": "pending"})
    if result.deleted_count == 0:
        raise HTTPException(404, "Follow request not found")

    return {"status": "rejected"}


@app.get("/users/{user_id}/follow-status/{target_id}")
async def get_follow_status(user_id: str, target_id: str):
    """Returns the follow status between user_id and target_id."""
    doc = await follows_collection.find_one({
        "follower_id": user_id,
        "following_id": target_id
    })
    if not doc:
        return {"status": "not_following"}
    return {"status": doc.get("status", "unknown")}



@app.get("/users/suggested")
async def get_suggested_users(user_id: Optional[str] = None):
    # Fetch random users, excluding the current user
    query = {}
    if user_id:
        # Also exclude people already connected or with pending requests
        existing_conns = await connections_collection.find({
            "$or": [{"requester_id": user_id}, {"target_id": user_id}]
        }).to_list(100)
        
        excluded_ids = {user_id}
        # Handle cases where user_id might be numeric or ObjectId in string form
        try:
            excluded_ids.add(ObjectId(user_id))
        except:
            pass

        for conn in existing_conns:
            excluded_ids.add(conn["requester_id"])
            excluded_ids.add(conn["target_id"])
            try:
                excluded_ids.add(ObjectId(conn["requester_id"]))
                excluded_ids.add(ObjectId(conn["target_id"]))
            except:
                pass
        
        query["_id"] = {"$nin": list(excluded_ids)}

    cursor = users_collection.find(query).limit(5)
    
    suggested = []
    async for doc in cursor:
        suggested.append({
            "uid": str(doc["_id"]),
            "username": doc.get("username"),
            "display_name": doc.get("display_name"),
            "photoURL": doc.get("photoURL"),
            "headline": doc.get("headline", "Member")
        })
    return suggested

@app.get("/users/{user_id}")
async def get_user_profile(user_id: str):
    user = await get_user_by_any_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Get follower/following counts
    followers_count = await follows_collection.count_documents({"following_id": user_id})
    following_count = await follows_collection.count_documents({"follower_id": user_id})
    
    # Get posts count
    posts_count = await posts_collection.count_documents({"user_id": user_id, "is_deleted": False}) # Assuming soft delete or just check existence
    
    user_info = {
        "uid": user.get("uid") or str(user["_id"]),
        "username": user.get("username"),
        "display_name": user.get("display_name"),
        "email": user.get("email"),
        "photoURL": user.get("photoURL"),
        "role": user.get("role", "user"),
        "is_banned": user.get("is_banned", False),
        "bio": user.get("bio", ""),
        "createdAt": user.get("createdAt"),
        "followed_hubs": user.get("followed_hubs", [])
    }
    
    return {
        "user_info": user_info,
        "stats": {
            "followers": followers_count,
            "following": following_count,
            "posts": posts_count
        }
    }

class UpdateProfileRequest(BaseModel):
    display_name: Optional[str] = None
    bio: Optional[str] = None
    photoURL: Optional[str] = None

@app.put("/users/{user_id}")
async def update_user_profile(user_id: str, profile: UpdateProfileRequest):
    update_data = {k: v for k, v in profile.dict().items() if v is not None}
    
    if not update_data:
        return {"status": "no_changes"}
        
    update_data["updatedAt"] = datetime.now(timezone.utc).isoformat()
    
    # Check if user exists first to get the correct _id for update
    user = await get_user_by_any_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    result = await users_collection.update_one(
        {"_id": user["_id"]},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
        
    return {"status": "updated"}

@app.get("/users/{user_id}/followers")
async def get_followers(user_id: str, requester_id: Optional[str] = None):
    user = await get_user_by_any_id(user_id)
    if not user:
        return []
    
    user_ids = [str(user["_id"])]
    if user.get("uid"):
        user_ids.append(user["uid"])
        
    cursor = follows_collection.find({"following_id": {"$in": user_ids}})
    followers = []
    seen_ids = set()  # prevent duplicates when user has both _id and uid in follows
    async for doc in cursor:
        f_user = await get_user_by_any_id(doc["follower_id"])
        if f_user:
            uid = str(f_user["_id"])
            if uid in seen_ids:
                continue
            seen_ids.add(uid)
            is_following = False
            if requester_id:
                f_ids = [str(f_user["_id"])]
                if f_user.get("uid"): f_ids.append(f_user["uid"])
                req_follow = await follows_collection.find_one({
                    "follower_id": requester_id,
                    "following_id": {"$in": f_ids}
                })
                is_following = bool(req_follow)
                
            followers.append({
                "user_id": str(f_user["_id"]),
                "username": f_user.get("username"),
                "display_name": f_user.get("display_name"),
                "user_pic": f_user.get("photoURL"),
                "is_following": is_following
            })
    return followers

@app.get("/users/{user_id}/following")
async def get_following(user_id: str, requester_id: Optional[str] = None):
    user = await get_user_by_any_id(user_id)
    if not user:
        return []
    
    user_ids = [str(user["_id"])]
    if user.get("uid"):
        user_ids.append(user["uid"])
        
    cursor = follows_collection.find({"follower_id": {"$in": user_ids}})
    following = []
    seen_ids = set()  # prevent duplicates
    async for doc in cursor:
        f_user = await get_user_by_any_id(doc["following_id"])
        if f_user:
            uid = str(f_user["_id"])
            if uid in seen_ids:
                continue
            seen_ids.add(uid)
            is_following = False
            if requester_id:
                f_ids = [str(f_user["_id"])]
                if f_user.get("uid"): f_ids.append(f_user["uid"])
                req_follow = await follows_collection.find_one({
                    "follower_id": requester_id,
                    "following_id": {"$in": f_ids}
                })
                is_following = bool(req_follow)
                
            following.append({
                "user_id": str(f_user["_id"]),
                "username": f_user.get("username"),
                "display_name": f_user.get("display_name"),
                "user_pic": f_user.get("photoURL"),
                "is_following": is_following
            })
    return following

# --- CONNECTIONS (SOCIAL GRAPH) ---

class ConnectRequest(BaseModel):
    requester_id: str

# from database import connections_collection

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
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    # Notify Target
    await create_notification(target_id, "connection_request", req.requester_id)
    
    return {"status": "request_sent"}

@app.post("/connect/{target_id}/accept")
async def accept_connection(target_id: str, req: ConnectRequest):
    # 'req.requester_id' is the ACCEPTOR (Current User)
    # 'target_id' is the REQUESTER (The person who sent the request)
    
    # We look for a pending request where target_id sent it to req.requester_id
    doc = await connections_collection.find_one({
        "requester_id": target_id,
        "target_id": req.requester_id,
        "status": "pending"
    })

    if not doc:
        # Fallback: maybe the parameters were swapped by frontend
        doc = await connections_collection.find_one({
            "requester_id": req.requester_id,
            "target_id": target_id,
            "status": "pending"
        })

    if not doc:
        raise HTTPException(404, "No pending request found between these users")

    await connections_collection.update_one(
        {"_id": doc["_id"]},
        {"$set": {"status": "accepted", "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    # Notify the other person (the one who didn't just click accept)
    other_person_id = doc["requester_id"] if doc["target_id"] == req.requester_id else doc["target_id"]
    await create_notification(other_person_id, "connection_accepted", req.requester_id)
    
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
        user = await get_user_by_any_id(doc["requester_id"])
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
        
        user = await get_user_by_any_id(other_id)
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
    

# --- DRAFTS ---

@app.post("/drafts/")
async def create_draft(draft: DraftRequest):
    new_draft = {
        "user_id": draft.user_id,
        "content": draft.content,
        "category": draft.category,
        "tags": draft.tags,
        "image_url": draft.image_url,
        "is_anonymous": draft.is_anonymous,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    result = await drafts_collection.insert_one(new_draft)
    return {"id": str(result.inserted_id), "status": "saved"}

@app.get("/drafts/")
async def get_my_drafts(user_id: str):
    cursor = drafts_collection.find({"user_id": user_id}).sort("updated_at", -1)
    drafts = []
    async for doc in cursor:
        drafts.append(serialize_doc(doc))
    return drafts

@app.delete("/drafts/{draft_id}")
async def delete_draft(draft_id: str, user_id: str):
    try:
        oid = ObjectId(draft_id)
    except:
        raise HTTPException(404, "Draft not found")

    result = await drafts_collection.delete_one({"_id": oid, "user_id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(404, "Draft not found or unauthorized")
        
    return {"status": "deleted"}

# --- MESSAGING SYSTEM ---
from websocket_manager import manager

# WebSocket endpoint for real-time messaging
@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    print(f"📥 [WS] Attempting to connect user {user_id}")
    try:
        await manager.connect(user_id, websocket)
        print(f"✅ [WS] User {user_id} connected successfully")
    except Exception as e:
        print(f"❌ [WS] Connection failed for {user_id}: {e}")
        return
        
    try:
        while True:
            # Keep connection alive and listen for messages
            data = await websocket.receive_text()
            print(f"📩 [WS] Received data from {user_id}: {data}")
            # Handle incoming WebSocket messages (typing indicators, etc.)
            try:
                message_data = json.loads(data)
                if message_data.get("type") == "typing":
                    # Broadcast typing indicator to other participant
                    conversation_id = message_data.get("conversation_id")
                    if conversation_id:
                        conv = await conversations_collection.find_one({"_id": ObjectId(conversation_id)})
                        if conv:
                            other_user = [p for p in conv["participants"] if p != user_id][0]
                            await manager.send_typing_indicator(other_user, conversation_id, message_data.get("is_typing", False))
            except Exception as e:
                print(f"⚠️ [WS] Error processing message: {e}")
    except WebSocketDisconnect:
        print(f"🔌 [WS] User {user_id} disconnected normally")
        manager.disconnect(user_id)
    except Exception as e:
        print(f"❌ [WS] Unexpected error for user {user_id}: {e}")
        manager.disconnect(user_id)

@app.patch("/posts/{post_id}")
async def update_post(post_id: str, req: PostUpdate, user_id: str):
    try:
        oid = ObjectId(post_id)
    except:
        raise HTTPException(404, "Post not found")

    post = await posts_collection.find_one({"_id": oid})
    if not post:
        raise HTTPException(404, "Post not found")
        
    if post.get("user_id") != user_id:
        raise HTTPException(403, "Permission denied")

    update_data = {}
    if req.title is not None: update_data["title"] = req.title
    if req.content is not None: update_data["content"] = req.content
    if req.category is not None: update_data["category"] = req.category
    if req.tags is not None: update_data["tags"] = req.tags
    
    if update_data:
        update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
        await posts_collection.update_one({"_id": oid}, {"$set": update_data})
        
        # Invalidate cache
        await invalidate_category_cache(post.get("category", "Life"))
        
    return {"status": "updated"}

@app.post("/posts/{post_id}/archive")
async def archive_post(post_id: str, user_id: str):
    try:
        oid = ObjectId(post_id)
    except:
        raise HTTPException(404, "Post not found")

    post = await posts_collection.find_one({"_id": oid})
    if not post:
        raise HTTPException(404, "Post not found")
        
    if post.get("user_id") != user_id:
        raise HTTPException(403, "Permission denied")

    await posts_collection.update_one({"_id": oid}, {"$set": {"is_archived": True}})
    await invalidate_category_cache(post.get("category", "Life"))
    return {"status": "archived"}

@app.post("/posts/{post_id}/unarchive")
async def unarchive_post(post_id: str, user_id: str):
    try:
        oid = ObjectId(post_id)
    except:
        raise HTTPException(404, "Post not found")

    post = await posts_collection.find_one({"_id": oid})
    if not post:
        raise HTTPException(404, "Post not found")
        
    if post.get("user_id") != user_id:
        raise HTTPException(403, "Permission denied")

    await posts_collection.update_one({"_id": oid}, {"$set": {"is_archived": False}})
    await invalidate_category_cache(post.get("category", "Life"))
    return {"status": "unarchived"}


# --- GAMIFICATION ROUTES ---
@app.get("/api/v1/users/{user_id}/score")
async def get_user_score(user_id: str):
    """Get a user's Phoenix Score and badges"""
    try:
        if not ObjectId.is_valid(user_id):
             raise HTTPException(status_code=400, detail="Invalid user ID")
             
        user = await users_collection.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
            
        return {
            "score": user.get("phoenix_score", 0),
            "badges": user.get("badges", [])
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching score: {e}")

@app.post("/api/v1/posts/{post_id}/collaborators")
async def invite_collaborator(post_id: str, collaborator_id: str):
    """Invite a user to collaborate on a post"""
    try:
        if not ObjectId.is_valid(post_id) or not ObjectId.is_valid(collaborator_id):
             raise HTTPException(status_code=400, detail="Invalid ID format")

        # Verify post exists
        post = await posts_collection.find_one({"_id": ObjectId(post_id)})
        if not post:
            raise HTTPException(status_code=404, detail="Post not found")
            
        # Verify collaborator exists
        collaborator = await users_collection.find_one({"_id": ObjectId(collaborator_id)})
        if not collaborator:
            raise HTTPException(status_code=404, detail="Collaborator not found")
            
        # Add to collaborators list if not already there
        if collaborator_id not in post.get("collaborators", []):
            await posts_collection.update_one(
                {"_id": ObjectId(post_id)},
                {"$addToSet": {"collaborators": collaborator_id}}
            )
            
            # GAMIFICATION: Award points for collaboration
            try:
                from gamification import calculate_score_action
                points = calculate_score_action("collaboration")
                # Intentionally passing for now
                pass 
            except Exception:
                pass

        return {"status": "collaborator_added"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error adding collaborator: {e}")


# ==================== COMMUNITIES ENDPOINTS ====================

@app.post("/api/v1/communities/")
async def api_create_community(data: CommunityCreate, user = Depends(get_current_user)):
    """Create a new community."""
    try:
        community = await create_community(user["_id"], data)
        return community
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create community: {e}")


@app.get("/api/v1/communities/")
async def api_list_communities(
    search: str = Query(""),
    category: str = Query(""),
    sort: str = Query("members"),
    skip: int = Query(0),
    limit: int = Query(20),
):
    """Discover / list communities (public endpoint)."""
    communities = await list_communities(search=search, category=category, sort=sort, skip=skip, limit=limit)
    return {"communities": communities}


@app.get("/api/v1/communities/{slug}")
async def api_get_community(slug: str):
    """Get a community by slug."""
    community = await get_community(slug)
    if not community:
        raise HTTPException(status_code=404, detail="Community not found")
    return community


@app.patch("/api/v1/communities/{slug}")
async def api_update_community(slug: str, data: CommunityUpdate, user = Depends(get_current_user)):
    """Update community details (mod/owner only)."""
    community = await get_community(slug)
    if not community:
        raise HTTPException(status_code=404, detail="Community not found")
    try:
        updated = await update_community(user["_id"], community["id"], data)
        return updated
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))


@app.delete("/api/v1/communities/{slug}")
async def api_delete_community(slug: str, user = Depends(get_current_user)):
    """Delete a community (owner only)."""
    community = await get_community(slug)
    if not community:
        raise HTTPException(status_code=404, detail="Community not found")
    try:
        await delete_community(user["_id"], community["id"])
        return {"status": "deleted"}
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))


@app.post("/api/v1/communities/{slug}/join")
async def api_join_community(slug: str, user = Depends(get_current_user)):
    """Join a community (public: instant; private: request)."""
    community = await get_community(slug)
    if not community:
        raise HTTPException(status_code=404, detail="Community not found")
    try:
        return await join_community(user["_id"], community["id"])
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/v1/communities/{slug}/leave")
async def api_leave_community(slug: str, user = Depends(get_current_user)):
    """Leave a community."""
    community = await get_community(slug)
    if not community:
        raise HTTPException(status_code=404, detail="Community not found")
    try:
        await leave_community(user["_id"], community["id"])
        return {"status": "left"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/api/v1/communities/{slug}/members")
async def api_get_members(
    slug: str,
    status: str = Query("active"),
    skip: int = Query(0),
    limit: int = Query(50),
):
    """List community members."""
    community = await get_community(slug)
    if not community:
        raise HTTPException(status_code=404, detail="Community not found")
    members = await get_members(community["id"], status=status, skip=skip, limit=limit)
    return {"members": members}


@app.post("/api/v1/communities/{slug}/approve/{target_uid}")
async def api_approve_member(slug: str, target_uid: str, user = Depends(get_current_user)):
    """Approve a pending join request (mod/owner only)."""
    community = await get_community(slug)
    if not community:
        raise HTTPException(status_code=404, detail="Community not found")
    try:
        await approve_member(user["_id"], community["id"], target_uid)
        return {"status": "approved"}
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))


@app.delete("/api/v1/communities/{slug}/kick/{target_uid}")
async def api_kick_member(slug: str, target_uid: str, user = Depends(get_current_user)):
    """Remove a member from the community (mod/owner only)."""
    community = await get_community(slug)
    if not community:
        raise HTTPException(status_code=404, detail="Community not found")
    try:
        await kick_member(user["_id"], community["id"], target_uid)
        return {"status": "kicked"}
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))


@app.post("/api/v1/communities/{slug}/promote/{target_uid}")
async def api_promote_member(slug: str, target_uid: str, user = Depends(get_current_user)):
    """Promote a member to mod (owner only)."""
    community = await get_community(slug)
    if not community:
        raise HTTPException(status_code=404, detail="Community not found")
    try:
        await promote_member(user["_id"], community["id"], target_uid)
        return {"status": "promoted"}
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))


@app.post("/api/v1/communities/{slug}/demote/{target_uid}")
async def api_demote_member(slug: str, target_uid: str, user = Depends(get_current_user)):
    """Demote a mod to regular member (owner only)."""
    community = await get_community(slug)
    if not community:
        raise HTTPException(status_code=404, detail="Community not found")
    try:
        await demote_member(user["_id"], community["id"], target_uid)
        return {"status": "demoted"}
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))


@app.get("/api/v1/communities/{slug}/posts")
async def api_get_community_posts(
    slug: str,
    sort: str = Query("new"),
    skip: int = Query(0),
    limit: int = Query(20),
):
    """Get posts in a community feed."""
    community = await get_community(slug)
    if not community:
        raise HTTPException(status_code=404, detail="Community not found")
    posts = await get_community_posts(community["id"], sort=sort, skip=skip, limit=limit)
    return {"posts": posts}


@app.get("/api/v1/users/{user_id}/communities")
async def api_get_user_communities(user_id: str):
    """Get communities a user belongs to."""
    comms = await get_user_communities(user_id)
    return {"communities": comms}

# ==================== PHASE 2: PROFESSIONAL PROFILES & ENGAGEMENT ====================
from database import stories_collection
from fastapi.responses import JSONResponse

# --- PROFESSIONAL PROFILES (Endorse Skill) ---
@app.post("/users/{user_id}/skills/{skill_name}/endorse")
async def endorse_skill(user_id: str, skill_name: str, endorser_id: str = Query(...)):
    if user_id == endorser_id:
        raise HTTPException(status_code=400, detail="Cannot endorse your own skill")
    
    user = await users_collection.find_one({"_id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    skills = user.get("skills", [])
    skill_found = False
    
    for skill in skills:
        if skill.get("name") == skill_name:
            if "endorsers" not in skill:
                skill["endorsers"] = []
                
            if endorser_id in skill["endorsers"]:
                skill["endorsers"].remove(endorser_id)
                skill["endorsements"] = max(0, skill.get("endorsements", 1) - 1)
            else:
                skill["endorsers"].append(endorser_id)
                skill["endorsements"] = skill.get("endorsements", 0) + 1
            skill_found = True
            break
            
    if not skill_found:
        raise HTTPException(status_code=404, detail="Skill not found for this user")
        
    await users_collection.update_one(
        {"_id": user_id},
        {"$set": {"skills": skills}}
    )
    
    if endorser_id in [s.get("endorsers", []) for s in skills if s.get("name") == skill_name][0]:
        await create_notification(
            user_id=user_id,
            type="skill_endorsement",
            actor_id=endorser_id,
            message=f"endorsed you for {skill_name}"
        )
        
    return {"message": "Skill endorsement updated", "skills": skills}


# --- STORIES ---
@app.post("/stories")
async def create_story(story_data: StoryCreate):
    import uuid
    from datetime import datetime
    
    story = story_data.dict()
    story["id"] = f"story_{uuid.uuid4().hex[:12]}"
    story["created_at"] = datetime.utcnow().isoformat()
    story["viewers"] = []
    
    user = await users_collection.find_one({"_id": story_data.user_id})
    if user:
        story["user_name"] = user.get("display_name", user.get("username", "Unknown"))
        story["user_pic"] = user.get("photoURL", "")
        
    await stories_collection.insert_one(story)
    story.pop("_id", None)
    return story

@app.get("/stories/feed")
async def get_stories_feed(user_id: str = Query(...)):
    """Get active stories (last 24h) from followed users + self"""
    from datetime import datetime, timedelta
    
    following_cursor = follows_collection.find({"follower_id": user_id})
    following_docs = await following_cursor.to_list(length=1000)
    followed_ids = [doc["following_id"] for doc in following_docs]
    followed_ids.append(user_id)
    
    time_threshold = (datetime.utcnow() - timedelta(hours=24)).isoformat()
    
    stories_cursor = stories_collection.find({
        "user_id": {"$in": followed_ids},
        "created_at": {"$gte": time_threshold}
    }).sort("created_at", 1)
    
    stories = await stories_cursor.to_list(length=100)
    for s in stories:
        s.pop("_id", None)
        
    grouped_stories = {}
    for story in stories:
        uid = story["user_id"]
        if uid not in grouped_stories:
            grouped_stories[uid] = {
                "user_id": uid,
                "user_name": story.get("user_name", "User"),
                "user_pic": story.get("user_pic", ""),
                "has_unseen": user_id not in story.get("viewers", []),
                "stories": []
            }
        grouped_stories[uid]["stories"].append(story)
        if user_id not in story.get("viewers", []):
             grouped_stories[uid]["has_unseen"] = True
             
    result_list = list(grouped_stories.values())
    result_list.sort(key=lambda x: (not x["has_unseen"], -len(x["stories"])))
    return result_list

@app.post("/stories/{story_id}/view")
async def view_story(story_id: str, viewer_id: str = Query(...)):
    await stories_collection.update_one(
        {"id": story_id},
        {"$addToSet": {"viewers": viewer_id}}
    )
    return {"status": "success"}


# --- POST REACTIONS (Animated Emojis) ---
@app.post("/posts/{post_id}/reactions")
async def toggle_post_reaction(post_id: str, reaction: ReactionCreate):
    post = await posts_collection.find_one({"id": post_id})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
        
    reactions = post.get("specific_reactions", {})
    user_id = reaction.user_id
    rtype = reaction.type
    
    if "user_reactions" not in post:
        post["user_reactions"] = {}
        
    user_reactions = post.get("user_reactions", {})
    current_user_reaction = user_reactions.get(user_id)
    
    if current_user_reaction == rtype:
        del user_reactions[user_id]
        if rtype in reactions and reactions[rtype] > 0:
            reactions[rtype] -= 1
        
        await posts_collection.update_one(
            {"id": post_id},
            {
                "$set": {
                    "specific_reactions": reactions,
                    "user_reactions": user_reactions
                },
                "$inc": {"reaction_count": -1}
            }
        )
        action = "removed"
    else:
        if current_user_reaction and current_user_reaction in reactions:
            if reactions[current_user_reaction] > 0:
                reactions[current_user_reaction] -= 1
                
        reactions[rtype] = reactions.get(rtype, 0) + 1
        user_reactions[user_id] = rtype
        
        inc_val = 1 if not current_user_reaction else 0
        
        await posts_collection.update_one(
            {"id": post_id},
            {
                "$set": {
                    "specific_reactions": reactions,
                    "user_reactions": user_reactions
                },
                "$inc": {"reaction_count": inc_val}
            }
        )
        
        if post.get("user_id") != user_id:
            await create_notification(
                user_id=post.get("user_id"),
                type="reaction",
                actor_id=user_id,
                resource_id=post_id,
                message=f"reacted to your post with {rtype}"
            )
            
        action = "added"
        
    return {
        "status": "success", 
        "action": action, 
        "specific_reactions": reactions,
        "user_reaction": user_reactions.get(user_id)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

