import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from bson import ObjectId

MONGO_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
client = AsyncIOMotorClient(MONGO_URL)
db = client.failure_db
connections_collection = db.get_collection("connections")
users_collection = db.get_collection("users")

async def debug():
    print("--- CONNECTIONS ---")
    count = 0
    async for conn in connections_collection.find({}):
        count += 1
        print(f"ID: {conn['_id']} ({type(conn['_id'])}) | Req: {conn['requester_id']} ({type(conn['requester_id'])}) | Tar: {conn['target_id']} ({type(conn['target_id'])}) | Status: {conn['status']}")
    print(f"Total connections: {count}")
    
    print("\n--- USERS (Sample) ---")
    async for user in users_collection.find({}).limit(5):
        print(f"ID: {user['_id']} ({type(user['_id'])}) | Username: {user.get('username')} | UID: {user.get('uid')}")

if __name__ == "__main__":
    asyncio.run(debug())
