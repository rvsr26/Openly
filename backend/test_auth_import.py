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
    print("SUCCESS")
except Exception as e:
    print(f"ERROR: {e}")
