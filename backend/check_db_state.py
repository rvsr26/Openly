import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

async def final_check():
    client = AsyncIOMotorClient(os.getenv("MONGODB_URL", "mongodb://localhost:27017"))
    db = client.get_database("failure_db")
    users = db.get_collection("users")
    
    # Check by UID (what frontend uses)
    uid = "WLWMdQ7ipIdk4kSj9KjVoEmHvpX2"
    user = await users.find_one({"_id": uid})
    if not user:
        user = await users.find_one({"uid": uid})
    
    with open("db_status.txt", "w") as f:
        if user:
            f.write(f"User Found:\n")
            f.write(f"ID: {user.get('_id')}\n")
            f.write(f"UID: {user.get('uid')}\n")
            f.write(f"Email: {user.get('email')}\n")
            f.write(f"Role: {user.get('role')}\n")
            f.write(f"Username: {user.get('username')}\n")
        else:
            f.write(f"User {uid} NOT FOUND in failure_db\n")
            
        # Also list all with role admin
        f.write("\nAll Admins:\n")
        async for a in users.find({"role": "admin"}):
             f.write(f"ID: {a.get('_id')}, Email: {a.get('email')}, UID: {a.get('uid')}\n")

if __name__ == "__main__":
    asyncio.run(final_check())
