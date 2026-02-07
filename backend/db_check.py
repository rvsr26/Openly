import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

async def check():
    load_dotenv()
    url = os.getenv('MONGODB_URL')
    print(f"Connecting to: {url}")
    client = AsyncIOMotorClient(url)
    db = client.failure_db
    
    # Check users
    users_list = await db.users.find().to_list(10)
    print("\n--- USERS ---")
    for u in users_list:
        print(f"ID: {u['_id']}, photoURL: {u.get('photoURL')}")
        
    # Check posts
    posts_list = await db.posts.find().sort("created_at", -1).to_list(5)
    print("\n--- POSTS ---")
    for p in posts_list:
        print(f"ID: {str(p['_id'])}, user_pic: {p.get('user_pic')}, author_pic: {p.get('author_pic')}")

if __name__ == "__main__":
    asyncio.run(check())
