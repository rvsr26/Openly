import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from datetime import datetime, timezone
import secrets

# Copy of database connection logic
MONGO_URL = "mongodb://localhost:27017" # Default local, since I can't easily read .env here without complexity
# Actually let's try to find it from env if possible
MONGO_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
client = AsyncIOMotorClient(MONGO_URL)
db = client.failure_db
users_collection = db.get_collection("users")

async def seed():
    mock_users = [
        {
            "username": "resilience_pro",
            "display_name": "Sarah Chen",
            "photoURL": "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
            "headline": "Failed at 3 Startups | Now VC",
            "bio": "Sharing learnings from the trenches. Failure is just data.",
            "email": "sarah@example.com",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "username": "pivot_master",
            "display_name": "Marcus Thorne",
            "photoURL": "https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus",
            "headline": "Ex-Founder @ FailedAI",
            "bio": "Learning how to pivot before the cliff.",
            "email": "marcus@example.com",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "username": "growth_hacker_fail",
            "display_name": "Elena Rodriguez",
            "photoURL": "https://api.dicebear.com/7.x/avataaars/svg?seed=Elena",
            "headline": "Growth Lead | Mistakes are Lessons",
            "bio": "Documenting the $1M ad spend mistake.",
            "email": "elena@example.com",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "username": "tech_lead_failure",
            "display_name": "David Kim",
            "photoURL": "https://api.dicebear.com/7.x/avataaars/svg?seed=David",
            "headline": "Senior Engineer | Burnout Survivor",
            "bio": "Building better systems after breaking them.",
            "email": "david@example.com",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]

    for user_data in mock_users:
        # Check if exists
        existing = await users_collection.find_one({"username": user_data["username"]})
        if not existing:
            # Add a random uid if not present
            user_data["uid"] = secrets.token_hex(8)
            await users_collection.insert_one(user_data)
            print(f"Inserted {user_data['username']}")
        else:
            print(f"Skipped {user_data['username']} (already exists)")

if __name__ == "__main__":
    asyncio.run(seed())
