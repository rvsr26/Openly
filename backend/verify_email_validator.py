from pydantic import BaseModel, EmailStr, ValidationError

class User(BaseModel):
    email: EmailStr

try:
    user = User(email="test@example.com")
    print("Success: Email validation working")
except ImportError:
    print("Error: email-validator not installed")
except Exception as e:
    print(f"Error: {e}")
