import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

async def list_admins():
    MONGO_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    client = AsyncIOMotorClient(MONGO_URL)
    db = client.get_database("failure_db")
    users_collection = db.get_collection("users")
    
    async for user in users_collection.find({"email": "admin@openly.com"}):
        print(f"ID: {user.get('_id')}, UID: {user.get('uid')}, Role: {user.get('role')}, Username: {user.get('username')}")

if __name__ == "__main__":
    asyncio.run(list_admins())
