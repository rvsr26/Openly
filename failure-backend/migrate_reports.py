import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import os
from dotenv import load_dotenv

load_dotenv()

async def migrate():
    mongo_url = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    client = AsyncIOMotorClient(mongo_url)
    db = client.failure_db
    
    posts_col = db.get_collection("posts")
    reports_col = db.get_collection("reports")
    
    print("Starting migration: report_count initialization...")
    
    # 1. Initialize report_count to 0 for all posts that don't have it
    result = await posts_col.update_many(
        {"report_count": {"$exists": False}},
        {"$set": {"report_count": 0}}
    )
    print(f"Initialized report_count for {result.modified_count} posts.")
    
    # 2. Count reports and update report_count
    # Optimization: Aggregate reports by target_id
    pipeline = [
        {"$match": {"target_type": "post"}},
        {"$group": {"_id": "$target_id", "count": {"$sum": 1}}}
    ]
    
    report_counts = reports_col.aggregate(pipeline)
    
    count = 0
    async for item in report_counts:
        try:
            post_id = item["_id"]
            report_count = item["count"]
            
            # Update post
            await posts_col.update_one(
                {"_id": ObjectId(post_id)},
                {"$set": {"report_count": report_count}}
            )
            count += 1
        except Exception as e:
            print(f"Error updating post {item['_id']}: {e}")
            
    print(f"Updated report_count for {count} posts based on records.")
    print("Migration complete.")

if __name__ == "__main__":
    asyncio.run(migrate())
