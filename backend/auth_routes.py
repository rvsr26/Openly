"""
Authentication API Endpoints
Add these routes to main.py after the root endpoint
"""

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
    try:
        result = await verify_email_token(req.token)
        return result
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/auth/forgot-password")
async def api_forgot_password(req: PasswordResetRequest):
    """Send password reset link"""
    try:
        result = await send_password_reset_email(req.email)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/auth/reset-password")
async def api_reset_password(req: PasswordResetConfirm):
    """Reset password with token"""
    # Validate password strength
    validation = validate_password_strength(req.new_password)
    if not validation["valid"]:
        raise HTTPException(status_code=400, detail={"errors": validation["errors"]})
    
    try:
        result = await reset_password(req.token, req.new_password)
        return result
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/auth/oauth/login")
async def api_oauth_login(req: OAuthLoginRequest):
    """Handle OAuth login (Google, GitHub, LinkedIn)"""
    try:
        result = await handle_oauth_login(req.provider, req.access_token, req.user_info)
        return result
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/auth/me")
async def api_get_current_user(user = Depends(get_current_user)):
    """Get current authenticated user"""
    return {
        "id": user["_id"],
        "email": user.get("email"),
        "username": user.get("username"),
        "display_name": user.get("display_name"),
        "photoURL": user.get("photoURL"),
        "email_verified": user.get("email_verified", False)
    }

@app.post("/api/v1/auth/validate-username")
async def api_validate_username(username: str):
    """Check if username is valid and available"""
    # Validate format
    if not validate_username(username):
        return {
            "valid": False,
            "available": False,
            "error": "Username must be 3-30 characters and contain only letters, numbers, underscores, and hyphens"
        }
    
    # Check availability
    existing = await users_collection.find_one({"username": username.lower()})
    
    return {
        "valid": True,
        "available": existing is None,
        "error": None if existing is None else "Username already taken"
    }

@app.post("/api/v1/auth/validate-email")
async def api_validate_email(email: EmailStr):
    """Check if email is valid and available"""
    # Check if email exists
    existing = await users_collection.find_one({"email": email.lower()})
    
    return {
        "valid": validate_email(email),
        "available": existing is None,
        "error": None if existing is None else "Email already registered"
    }
