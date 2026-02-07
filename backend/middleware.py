"""
Security Middleware
Implements rate limiting, CSRF protection, security headers, and request logging
"""

import time
import hashlib
from collections import defaultdict
from datetime import datetime, timezone
from typing import Callable
from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
import secrets

# Rate Limiting
class RateLimiter:
    def __init__(self, requests_per_minute: int = 60):
        self.requests_per_minute = requests_per_minute
        self.requests = defaultdict(list)
    
    def is_allowed(self, identifier: str) -> bool:
        """Check if request is allowed based on rate limit"""
        now = time.time()
        minute_ago = now - 60
        
        # Clean old requests
        self.requests[identifier] = [
            req_time for req_time in self.requests[identifier]
            if req_time > minute_ago
        ]
        
        # Check limit
        if len(self.requests[identifier]) >= self.requests_per_minute:
            return False
        
        # Add current request
        self.requests[identifier].append(now)
        return True

# Global rate limiter
rate_limiter = RateLimiter(requests_per_minute=100)

# CSRF Protection
class CSRFProtection:
    def __init__(self):
        self.tokens = {}
    
    def generate_token(self, session_id: str) -> str:
        """Generate CSRF token for session"""
        token = secrets.token_urlsafe(32)
        self.tokens[session_id] = {
            "token": token,
            "created_at": time.time()
        }
        return token
    
    def validate_token(self, session_id: str, token: str) -> bool:
        """Validate CSRF token"""
        if session_id not in self.tokens:
            return False
        
        stored = self.tokens[session_id]
        
        # Check expiration (24 hours)
        if time.time() - stored["created_at"] > 86400:
            del self.tokens[session_id]
            return False
        
        return stored["token"] == token

csrf_protection = CSRFProtection()

# Middleware Classes
class RateLimitMiddleware(BaseHTTPMiddleware):
    """Rate limiting middleware"""
    
    async def dispatch(self, request: Request, call_next: Callable):
        # Get client identifier (IP address)
        client_ip = request.client.host
        
        # Check rate limit
        if not rate_limiter.is_allowed(client_ip):
            return JSONResponse(
                status_code=429,
                content={"detail": "Too many requests. Please try again later."}
            )
        
        response = await call_next(request)
        return response

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Add security headers to all responses"""
    
    async def dispatch(self, request: Request, call_next: Callable):
        response = await call_next(request)
        
        # Security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
        
        return response

class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Log all requests for monitoring"""
    
    async def dispatch(self, request: Request, call_next: Callable):
        start_time = time.time()
        
        # Log request
        print(f"📥 {request.method} {request.url.path} - {request.client.host}")
        
        try:
            response = await call_next(request)
            
            # Calculate duration
            duration = time.time() - start_time
            
            # Log response
            print(f"📤 {request.method} {request.url.path} - {response.status_code} ({duration:.2f}s)")
            
            return response
        except Exception as e:
            duration = time.time() - start_time
            print(f"❌ {request.method} {request.url.path} - ERROR ({duration:.2f}s): {str(e)}")
            raise

class CSRFMiddleware(BaseHTTPMiddleware):
    """CSRF protection for state-changing requests"""
    
    SAFE_METHODS = {"GET", "HEAD", "OPTIONS"}
    EXEMPT_PATHS = {"/api/v1/auth/login", "/api/v1/auth/signup", "/ws"}
    
    async def dispatch(self, request: Request, call_next: Callable):
        # Skip CSRF check for safe methods
        if request.method in self.SAFE_METHODS:
            return await call_next(request)
        
        # Skip CSRF check for exempt paths
        if any(request.url.path.startswith(path) for path in self.EXEMPT_PATHS):
            return await call_next(request)
        
        # Get CSRF token from header
        csrf_token = request.headers.get("X-CSRF-Token")
        session_id = request.cookies.get("session_id")
        
        if not csrf_token or not session_id:
            return JSONResponse(
                status_code=403,
                content={"detail": "CSRF token missing"}
            )
        
        # Validate token
        if not csrf_protection.validate_token(session_id, csrf_token):
            return JSONResponse(
                status_code=403,
                content={"detail": "Invalid CSRF token"}
            )
        
        response = await call_next(request)
        return response

# Input Validation Helpers
def sanitize_input(text: str, max_length: int = 10000) -> str:
    """Sanitize user input to prevent XSS and injection attacks"""
    if not text:
        return ""
    
    # Truncate to max length
    text = text[:max_length]
    
    # Remove null bytes
    text = text.replace('\x00', '')
    
    # Basic XSS prevention (more comprehensive sanitization should be done client-side)
    dangerous_patterns = [
        '<script', '</script>',
        'javascript:', 'onerror=', 'onload=',
        '<iframe', '</iframe>'
    ]
    
    text_lower = text.lower()
    for pattern in dangerous_patterns:
        if pattern in text_lower:
            raise HTTPException(status_code=400, detail="Invalid input detected")
    
    return text.strip()

def validate_email(email: str) -> bool:
    """Validate email format"""
    import re
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))

def validate_username(username: str) -> bool:
    """Validate username format"""
    import re
    # Alphanumeric, underscore, hyphen, 3-30 characters
    pattern = r'^[a-zA-Z0-9_-]{3,30}$'
    return bool(re.match(pattern, username))

def validate_password_strength(password: str) -> dict:
    """Validate password strength"""
    errors = []
    
    if len(password) < 8:
        errors.append("Password must be at least 8 characters long")
    
    if not any(c.isupper() for c in password):
        errors.append("Password must contain at least one uppercase letter")
    
    if not any(c.islower() for c in password):
        errors.append("Password must contain at least one lowercase letter")
    
    if not any(c.isdigit() for c in password):
        errors.append("Password must contain at least one number")
    
    if not any(c in "!@#$%^&*()_+-=[]{}|;:,.<>?" for c in password):
        errors.append("Password must contain at least one special character")
    
    return {
        "valid": len(errors) == 0,
        "errors": errors
    }

# Request ID for tracing
def generate_request_id() -> str:
    """Generate unique request ID"""
    return secrets.token_urlsafe(16)

class RequestIDMiddleware(BaseHTTPMiddleware):
    """Add unique request ID to each request"""
    
    async def dispatch(self, request: Request, call_next: Callable):
        request_id = generate_request_id()
        request.state.request_id = request_id
        
        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        
        return response
