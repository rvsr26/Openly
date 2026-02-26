import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()
client = AsyncIOMotorClient(os.getenv("MONGODB_URL"))
db = client.failure_db

async def upgrade_to_admin():
    users_cursor = db.users.find().limit(5)
    users = await users_cursor.to_list(length=5)
    
    if not users:
        print("No users found in database. Please sign up an account on the frontend first.")
        return
        
    for i, user in enumerate(users):
        print(f"[{i}] {user.get('email')} / {user.get('username')} (Role: {user.get('role', 'user')})")
        
    user_to_upgrade = users[0]
    
    res = await db.users.update_one({"_id": user_to_upgrade["_id"]}, {"$set": {"role": "admin"}})
    if res.modified_count > 0:
        print(f"User {user_to_upgrade.get('email')} successfully upgraded to admin!")
    else:
        print(f"User {user_to_upgrade.get('email')} is already an admin or update failed.")

asyncio.run(upgrade_to_admin())
