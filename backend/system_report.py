import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
import json

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
client = AsyncIOMotorClient(MONGODB_URL)
db = client["failure_db"]
users_collection = db["users"]
posts_collection = db["posts"]
reports_collection = db["reports"]

async def main():
    total_users = await users_collection.count_documents({})
    total_posts = await posts_collection.count_documents({})
    flagged_posts = await posts_collection.count_documents({"is_flagged": True})
    total_reports = await reports_collection.count_documents({})
    
    admins = []
    async for admin in users_collection.find({"role": "admin"}):
        admins.append({
            "email": admin.get("email"),
            "username": admin.get("username"),
            "display_name": admin.get("display_name")
        })
    
    report_data = {
        "system_stats": {
            "total_users": total_users,
            "total_posts": total_posts,
            "flagged_posts": flagged_posts,
            "total_reports": total_reports
        },
        "admins": admins
    }
    
    print(json.dumps(report_data, indent=2))

if __name__ == "__main__":
    asyncio.run(main())
