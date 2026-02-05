"""
Authentication and Authorization Module
Handles OAuth, email verification, password reset, and JWT tokens
"""

import os
import secrets
import hashlib
from datetime import datetime, timedelta, timezone
from typing import Optional
from fastapi import HTTPException, Header
from pydantic import BaseModel, EmailStr
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from database import users_collection, verification_tokens_collection, password_reset_tokens_collection
import jwt

# Configuration
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

# Email Configuration
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
FROM_EMAIL = os.getenv("FROM_EMAIL", "noreply@openly.com")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

# Models
class EmailVerificationRequest(BaseModel):
    email: EmailStr
    user_id: str

class VerifyEmailRequest(BaseModel):
    token: str

class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str

class OAuthLoginRequest(BaseModel):
    provider: str  # 'google', 'github', 'linkedin'
    access_token: str
    user_info: dict

# Helper Functions
def generate_token() -> str:
    """Generate a secure random token"""
    return secrets.token_urlsafe(32)

def hash_password(password: str) -> str:
    """Hash password using SHA-256"""
    return hashlib.sha256(password.encode()).hexdigest()

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str) -> dict:
    """Verify and decode JWT token"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user(authorization: str = Header(None)):
    """Get current user from JWT token"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    token = authorization.replace("Bearer ", "")
    payload = verify_token(token)
    user_id = payload.get("sub")
    
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = await users_collection.find_one({"_id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return user

def send_email(to_email: str, subject: str, body: str, html_body: str = None):
    """Send email via SMTP"""
    if not SMTP_USER or not SMTP_PASSWORD:
        print(f"⚠️ Email not configured. Would send to {to_email}: {subject}")
        return
    
    try:
        msg = MIMEMultipart('alternative')
        msg['From'] = FROM_EMAIL
        msg['To'] = to_email
        msg['Subject'] = subject
        
        # Attach plain text and HTML versions
        msg.attach(MIMEText(body, 'plain'))
        if html_body:
            msg.attach(MIMEText(html_body, 'html'))
        
        # Send email
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.send_message(msg)
        
        print(f"✅ Email sent to {to_email}")
    except Exception as e:
        print(f"❌ Failed to send email: {e}")

# Email Verification
async def send_verification_email(email: str, user_id: str):
    """Send email verification link"""
    # Generate token
    token = generate_token()
    
    # Store token in database
    await verification_tokens_collection.insert_one({
        "user_id": user_id,
        "email": email,
        "token": token,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "expires_at": (datetime.now(timezone.utc) + timedelta(hours=24)).isoformat()
    })
    
    # Create verification link
    verification_link = f"{FRONTEND_URL}/verify-email?token={token}"
    
    # Email content
    subject = "Verify Your Email - Openly"
    body = f"""
    Welcome to Openly!
    
    Please verify your email address by clicking the link below:
    {verification_link}
    
    This link will expire in 24 hours.
    
    If you didn't create an account, please ignore this email.
    """
    
    html_body = f"""
    <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #0066cc;">Welcome to Openly!</h2>
                <p>Please verify your email address by clicking the button below:</p>
                <a href="{verification_link}" 
                   style="display: inline-block; padding: 12px 24px; background-color: #0066cc; 
                          color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">
                    Verify Email
                </a>
                <p style="color: #666; font-size: 14px;">
                    This link will expire in 24 hours.
                </p>
                <p style="color: #666; font-size: 14px;">
                    If you didn't create an account, please ignore this email.
                </p>
            </div>
        </body>
    </html>
    """
    
    send_email(email, subject, body, html_body)

async def verify_email_token(token: str):
    """Verify email token and mark user as verified"""
    # Find token
    token_doc = await verification_tokens_collection.find_one({"token": token})
    
    if not token_doc:
        raise HTTPException(status_code=400, detail="Invalid verification token")
    
    # Check expiration
    expires_at = datetime.fromisoformat(token_doc["expires_at"])
    if datetime.now(timezone.utc) > expires_at:
        raise HTTPException(status_code=400, detail="Verification token has expired")
    
    # Update user
    await users_collection.update_one(
        {"_id": token_doc["user_id"]},
        {
            "$set": {
                "email_verified": True,
                "email": token_doc["email"],
                "verified_at": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    # Delete token
    await verification_tokens_collection.delete_one({"_id": token_doc["_id"]})
    
    return {"status": "verified", "user_id": token_doc["user_id"]}

# Password Reset
async def send_password_reset_email(email: str):
    """Send password reset link"""
    # Find user
    user = await users_collection.find_one({"email": email})
    
    if not user:
        # Don't reveal if email exists
        return {"status": "sent"}
    
    # Generate token
    token = generate_token()
    
    # Store token
    await password_reset_tokens_collection.insert_one({
        "user_id": user["_id"],
        "email": email,
        "token": token,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "expires_at": (datetime.now(timezone.utc) + timedelta(hours=1)).isoformat()
    })
    
    # Create reset link
    reset_link = f"{FRONTEND_URL}/reset-password?token={token}"
    
    # Email content
    subject = "Reset Your Password - Openly"
    body = f"""
    Password Reset Request
    
    Click the link below to reset your password:
    {reset_link}
    
    This link will expire in 1 hour.
    
    If you didn't request a password reset, please ignore this email.
    """
    
    html_body = f"""
    <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #0066cc;">Password Reset Request</h2>
                <p>Click the button below to reset your password:</p>
                <a href="{reset_link}" 
                   style="display: inline-block; padding: 12px 24px; background-color: #0066cc; 
                          color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">
                    Reset Password
                </a>
                <p style="color: #666; font-size: 14px;">
                    This link will expire in 1 hour.
                </p>
                <p style="color: #666; font-size: 14px;">
                    If you didn't request a password reset, please ignore this email.
                </p>
            </div>
        </body>
    </html>
    """
    
    send_email(email, subject, body, html_body)
    
    return {"status": "sent"}

async def reset_password(token: str, new_password: str):
    """Reset password using token"""
    # Find token
    token_doc = await password_reset_tokens_collection.find_one({"token": token})
    
    if not token_doc:
        raise HTTPException(status_code=400, detail="Invalid reset token")
    
    # Check expiration
    expires_at = datetime.fromisoformat(token_doc["expires_at"])
    if datetime.now(timezone.utc) > expires_at:
        raise HTTPException(status_code=400, detail="Reset token has expired")
    
    # Hash new password
    hashed_password = hash_password(new_password)
    
    # Update user password
    await users_collection.update_one(
        {"_id": token_doc["user_id"]},
        {
            "$set": {
                "password_hash": hashed_password,
                "password_updated_at": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    # Delete token
    await password_reset_tokens_collection.delete_one({"_id": token_doc["_id"]})
    
    return {"status": "password_reset"}

# OAuth Integration
async def handle_oauth_login(provider: str, access_token: str, user_info: dict):
    """Handle OAuth login from Google, GitHub, LinkedIn"""
    email = user_info.get("email")
    
    if not email:
        raise HTTPException(status_code=400, detail="Email not provided by OAuth provider")
    
    # Check if user exists
    user = await users_collection.find_one({"email": email})
    
    if user:
        # Update OAuth info
        await users_collection.update_one(
            {"_id": user["_id"]},
            {
                "$set": {
                    f"oauth.{provider}": {
                        "access_token": access_token,
                        "user_info": user_info,
                        "last_login": datetime.now(timezone.utc).isoformat()
                    }
                }
            }
        )
        user_id = user["_id"]
    else:
        # Create new user
        new_user = {
            "_id": user_info.get("id") or secrets.token_urlsafe(16),
            "email": email,
            "email_verified": True,  # OAuth emails are pre-verified
            "display_name": user_info.get("name", ""),
            "photoURL": user_info.get("picture") or user_info.get("avatar_url"),
            "oauth": {
                provider: {
                    "access_token": access_token,
                    "user_info": user_info,
                    "last_login": datetime.now(timezone.utc).isoformat()
                }
            },
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        result = await users_collection.insert_one(new_user)
        user_id = new_user["_id"]
    
    # Create JWT token
    token = create_access_token({"sub": user_id, "email": email})
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "user_id": user_id
    }
