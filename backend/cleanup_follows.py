"""One-time script to remove duplicate follow records from the follows collection."""
import asyncio
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from database import follows_collection

async def cleanup_duplicate_follows():
    pipeline = [
        {"$group": {
            "_id": {"follower_id": "$follower_id", "following_id": "$following_id"},
            "ids": {"$push": "$_id"},
            "count": {"$sum": 1}
        }},
        {"$match": {"count": {"$gt": 1}}}
    ]
    cursor = follows_collection.aggregate(pipeline)
    deleted = 0
    async for doc in cursor:
        # Keep the first (oldest), delete the rest
        to_delete = doc["ids"][1:]
        result = await follows_collection.delete_many({"_id": {"$in": to_delete}})
        deleted += result.deleted_count
    print(f"✅ Deleted {deleted} duplicate follow records.")

if __name__ == "__main__":
    asyncio.run(cleanup_duplicate_follows())
