import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
import sys

load_dotenv()

MONGO_URI = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
sys.stdout.reconfigure(encoding='utf-8')
client = AsyncIOMotorClient(MONGO_URI)
db = client.failure_db
posts_collection = db.posts

async def check():
    total_posts = await posts_collection.count_documents({})
    posts_with_tags = await posts_collection.count_documents({"tags": {"$exists": True, "$ne": []}})
    posts_is_rejected_false = await posts_collection.count_documents({"is_rejected": False})
    posts_is_rejected_true = await posts_collection.count_documents({"is_rejected": True})
    posts_without_is_rejected = await posts_collection.count_documents({"is_rejected": {"$exists": False}})
    posts_with_sentiment = await posts_collection.count_documents({"sentiment": {"$exists": True}})
    
    print(f"Total posts: {total_posts}")
    print(f"Posts with tags: {posts_with_tags}")
    print(f"Posts with is_rejected == False: {posts_is_rejected_false}")
    print(f"Posts with is_rejected == True: {posts_is_rejected_true}")
    print(f"Posts without is_rejected field: {posts_without_is_rejected}")
    print(f"Posts with sentiment field: {posts_with_sentiment}")

asyncio.run(check())
