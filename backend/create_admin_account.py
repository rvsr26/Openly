import asyncio
import os
import hashlib
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from datetime import datetime, timezone
import secrets

load_dotenv()

# Configuration
MONGO_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
client = AsyncIOMotorClient(MONGO_URL)
# Check if failure_db or failure_sharing is used (saw both in logs)
# .env.example says failure_sharing, seed_users says failure_db
# Let's check backend/database.py to be sure
db = client.get_database("failure_db") 

async def create_admin():
    users_collection = db.get_collection("users")
    
    email = "admin@openly.com"
    username = "admin"
    password = "admin123"
    
    # Check if exists
    existing = await users_collection.find_one({"email": email})
    if existing:
        print(f"User(s) with {email} found. Promoting all to admin.")
        result = await users_collection.update_many(
            {"email": email}, 
            {"$set": {"role": "admin", "username": username, "email_verified": True, "is_active": True}}
        )
        print(f"Updated {result.modified_count} user(s) to admin.")
        return

    # Hash password (matching auth.py: hashlib.sha256(password.encode()).hexdigest())
    hashed_password = hashlib.sha256(password.encode()).hexdigest()
    
    new_user = {
        "_id": secrets.token_hex(16),
        "email": email,
        "username": username,
        "display_name": "System Administrator",
        "password_hash": hashed_password,
        "role": "admin",
        "email_verified": True,
        "is_active": True,
        "photoURL": "https://api.dicebear.com/7.x/avataaars/svg?seed=Admin",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await users_collection.insert_one(new_user)
    print(f"Admin account created successfully!")
    print(f"Email: {email}")
    print(f"Password: {password}")

if __name__ == "__main__":
    asyncio.run(create_admin())
