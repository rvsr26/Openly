import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from bson import ObjectId
from datetime import datetime, timezone

MONGO_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
client = AsyncIOMotorClient(MONGO_URL)
db = client.failure_db
connections_collection = db.get_collection("connections")
users_collection = db.get_collection("users")

async def test_setup():
    # Find two users
    users = await users_collection.find({}).to_list(2)
    if len(users) < 2:
        print("Not enough users to test")
        return
    
    user1_id = str(users[0]["_id"])
    user2_id = str(users[1]["_id"])
    
    # Create connection from user1 to user2
    await connections_collection.delete_many({}) # Clear for clean debug
    
    await connections_collection.insert_one({
        "requester_id": user1_id,
        "target_id": user2_id,
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    print(f"Created pending connection from {user1_id} to {user2_id}")

    # Now verify if we can find it via the endpoint logic
    # Find people who want to connect with user2 (target_id = user2_id)
    cursor = connections_collection.find({
        "target_id": user2_id,
        "status": "pending"
    })
    found = await cursor.to_list(10)
    print(f"Matched connections for user2: {len(found)}")
    for f in found:
        print(f"Req: {f['requester_id']} (Type: {type(f['requester_id'])})")
        # Try finding the user
        u = await users_collection.find_one({"_id": f['requester_id']})
        if not u:
             # Try with ObjectId
             u = await users_collection.find_one({"_id": ObjectId(f['requester_id'])})
             if u: print("Found user via ObjectId conversion!")
             else: print("User NOT found even with ObjectId conversion")
        else:
             print("Found user directly with string ID")

if __name__ == "__main__":
    asyncio.run(test_setup())
