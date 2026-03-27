import asyncio
from database import users_collection

async def get_admin_uid():
    user = await users_collection.find_one({"email": "admin@openly.com"})
    if user:
        # Check both uid and _id
        print(user.get("uid") or str(user.get("_id")))
    else:
        print("ADMIN_NOT_FOUND")

if __name__ == "__main__":
    asyncio.run(get_admin_uid())
