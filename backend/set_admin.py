import asyncio
import os
import sys
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

async def make_admin(email: str):
    client = AsyncIOMotorClient(os.getenv("MONGODB_URL"))
    db = client.failure_db
    
    user = await db.users.find_one({"email": email})
    
    if not user:
        print(f"❌ Could not find a user with email: {email}")
        print("Please make sure you have signed up on the frontend first.")
        return
        
    res = await db.users.update_one({"_id": user["_id"]}, {"$set": {"role": "admin"}})
    
    if res.modified_count > 0:
        print(f"✅ User {email} successfully upgraded to admin!")
    else:
        print(f"⚠️ User {email} is already an admin or update failed.")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python set_admin.py <user_email>")
        print("Example: python set_admin.py myemail@example.com")
        sys.exit(1)
        
    target_email = sys.argv[1]
    asyncio.run(make_admin(target_email))
