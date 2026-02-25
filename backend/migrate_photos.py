"""
Migration script: clears stale /uploads/ photo URLs from MongoDB.
After running, any user who uploaded a photo locally will need to re-upload once.
Their profile will show the default avatar in the meantime.
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

MONGO_URI = "mongodb://127.0.0.1:27017"
DB_NAME = "openly"

async def migrate():
    client = AsyncIOMotorClient(MONGO_URI)
    db = client[DB_NAME]

    # Find users with stale local paths
    stale_query = {
        "photoURL": {"$regex": "^/uploads/", "$options": "i"}
    }

    users_cursor = db.users.find(stale_query)
    fixed_users = 0

    async for user in users_cursor:
        uid = user["_id"]
        old_url = user.get("photoURL", "")
        print(f"  Fixing user {uid}: {old_url[:60]} -> NULL")

        # Clear the stale photoURL in users collection
        await db.users.update_one(
            {"_id": uid},
            {"$set": {"photoURL": None}}
        )

        # Also clear stale user_pic in all their posts
        result = await db.posts.update_many(
            {"user_id": uid, "user_pic": {"$regex": "^/uploads/", "$options": "i"}},
            {"$set": {"user_pic": None}}
        )

        print(f"    -> Fixed {result.modified_count} posts")
        fixed_users += 1

    print(f"\n✅ Migration complete. Fixed {fixed_users} user(s).")
    client.close()

asyncio.run(migrate())
