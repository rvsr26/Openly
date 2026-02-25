"""
Security Middleware
Implements rate limiting, CSRF protection, security headers, and request logging
"""

import time
import hashlib
from collections import defaultdict
from datetime import datetime, timezone
from typing import Callable
from fastapi import Request, HTTPException, Response
from fastapi.responses import JSONResponse
from starlette.datastructures import MutableHeaders
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
class RateLimitMiddleware:
    """Rate limiting middleware"""
    def __init__(self, app):
        self.app = app
        
    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            return await self.app(scope, receive, send)
            
        request = Request(scope, receive)
        client_ip = request.client.host if request.client else "unknown"
        
        if not rate_limiter.is_allowed(client_ip):
            response = JSONResponse(
                status_code=429,
                content={"detail": "Too many requests. Please try again later."}
            )
            return await response(scope, receive, send)
            
        return await self.app(scope, receive, send)

class SecurityHeadersMiddleware:
    """Add security headers to all responses"""
    def __init__(self, app):
        self.app = app
        
    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            return await self.app(scope, receive, send)
            
        async def send_wrapper(message):
            if message["type"] == "http.response.start":
                headers = MutableHeaders(scope=message)
                headers.append("X-Content-Type-Options", "nosniff")
                headers.append("X-Frame-Options", "DENY")
                headers.append("X-XSS-Protection", "1; mode=block")
                headers.append("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
                headers.append("Referrer-Policy", "strict-origin-when-cross-origin")
                headers.append("Permissions-Policy", "geolocation=(), microphone=(), camera=()")
            await send(message)
            
        return await self.app(scope, receive, send_wrapper)

class RequestLoggingMiddleware:
    """Log all requests for monitoring"""
    def __init__(self, app):
        self.app = app
        
    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            return await self.app(scope, receive, send)
            
        start_time = time.time()
        request = Request(scope, receive)
        client_host = request.client.host if request.client else "unknown"
        print(f"📥 {request.method} {request.url.path} - {client_host}")
        
        status_code = [500]
        async def send_wrapper(message):
            if message["type"] == "http.response.start":
                status_code[0] = message["status"]
            await send(message)
            
        try:
            await self.app(scope, receive, send_wrapper)
            duration = time.time() - start_time
            print(f"📤 {request.method} {request.url.path} - {status_code[0]} ({duration:.2f}s)")
        except Exception as e:
            duration = time.time() - start_time
            print(f"❌ {request.method} {request.url.path} - ERROR ({duration:.2f}s): {str(e)}")
            raise

class CSRFMiddleware:
    """CSRF protection for state-changing requests"""
    SAFE_METHODS = {"GET", "HEAD", "OPTIONS"}
    EXEMPT_PATHS = {"/api/v1/auth/login", "/api/v1/auth/signup", "/ws"}
    
    def __init__(self, app):
        self.app = app
        
    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            return await self.app(scope, receive, send)
            
        request = Request(scope, receive)
        
        if request.method in self.SAFE_METHODS or any(request.url.path.startswith(path) for path in self.EXEMPT_PATHS):
            return await self.app(scope, receive, send)
            
        csrf_token = request.headers.get("X-CSRF-Token")
        session_id = request.cookies.get("session_id")
        
        if not csrf_token or not session_id:
            response = JSONResponse(status_code=403, content={"detail": "CSRF token missing"})
            return await response(scope, receive, send)
            
        if not csrf_protection.validate_token(session_id, csrf_token):
            response = JSONResponse(status_code=403, content={"detail": "Invalid CSRF token"})
            return await response(scope, receive, send)
            
        return await self.app(scope, receive, send)

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

class RequestIDMiddleware:
    """Add unique request ID to each request"""
    def __init__(self, app):
        self.app = app
        
    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            return await self.app(scope, receive, send)
            
        request_id = generate_request_id()
        
        # Inject into scope so endpoints can access if needed
        if "state" not in scope:
            scope["state"] = {}
        scope["state"]["request_id"] = request_id
        
        async def send_wrapper(message):
            if message["type"] == "http.response.start":
                headers = MutableHeaders(scope=message)
                headers.append("X-Request-ID", request_id)
            await send(message)
            
        return await self.app(scope, receive, send_wrapper)
