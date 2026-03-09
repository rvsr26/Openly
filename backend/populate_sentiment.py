import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from ai_utils import get_sentiment
import sys

load_dotenv()

MONGO_URI = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
sys.stdout.reconfigure(encoding='utf-8')
client = AsyncIOMotorClient(MONGO_URI)
db = client.failure_db
posts_collection = db.posts

async def migrate_sentiments():
    cursor = posts_collection.find({"sentiment": {"$exists": False}})
    updated = 0
    failed = 0
    
    async for post in cursor:
        content = post.get("content", "")
        if not content:
            continue
            
        try:
            sentiment = get_sentiment(content)
            await posts_collection.update_one(
                {"_id": post["_id"]},
                {"$set": {"sentiment": sentiment}}
            )
            updated += 1
            print(f"Updated post {post['_id']} with sentiment: {sentiment}")
        except Exception as e:
            failed += 1
            print(f"Failed to process post {post['_id']}: {e}")
            
    print(f"\nMigration complete. Updated {updated} posts. Failed {failed} posts.")

asyncio.run(migrate_sentiments())
