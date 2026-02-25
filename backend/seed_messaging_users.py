import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from datetime import datetime, timezone
from dotenv import load_dotenv

load_dotenv()

MONGO_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
client = AsyncIOMotorClient(MONGO_URL)
db = client.failure_db
users_collection = db.get_collection("users")

async def seed_messaging_users():
    test_users = [
        {
            "_id": "local_test_user",
            "username": "local_test_user",
            "display_name": "Local Test User",
            "photoURL": "https://api.dicebear.com/7.x/avataaars/svg?seed=Local",
            "email": "local@example.com",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "_id": "remote_test_user",
            "username": "remote_test_user",
            "display_name": "Remote Test User",
            "photoURL": "https://api.dicebear.com/7.x/avataaars/svg?seed=Remote",
            "email": "remote@example.com",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]

    for user_data in test_users:
        existing = await users_collection.find_one({"_id": user_data["_id"]})
        if not existing:
            await users_collection.insert_one(user_data)
            print(f"✅ Created test user: {user_data['_id']}")
        else:
            print(f"ℹ️ Test user already exists: {user_data['_id']}")

    print("🚀 Seeding complete!")

if __name__ == "__main__":
    asyncio.run(seed_messaging_users())
