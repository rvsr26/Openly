import asyncio
import os
import smtplib
from motor.motor_asyncio import AsyncIOMotorClient
from redis import asyncio as aioredis
from dotenv import load_dotenv

async def verify():
    load_dotenv()
    results = {"MongoDB": False, "Redis": False, "SMTP": False}
    
    # 1. MongoDB
    print("\n--- Checking MongoDB ---")
    try:
        mongo_url = os.getenv("MONGODB_URL")
        if not mongo_url:
            print("❌ MONGODB_URL not found in .env")
        else:
            client = AsyncIOMotorClient(mongo_url, serverSelectionTimeoutMS=5000)
            # Ping
            await client.admin.command('ping')
            print("✅ MongoDB Connection Successful")
            results["MongoDB"] = True
    except Exception as e:
        print(f"❌ MongoDB Failed: {e}")

    # 2. Redis
    print("\n--- Checking Redis ---")
    try:
        redis_url = os.getenv("REDIS_URL")
        if not redis_url:
            print("❌ REDIS_URL not found in .env")
        else:
            redis = aioredis.from_url(redis_url, encoding="utf-8", decode_responses=True, socket_timeout=5.0)
            await redis.ping()
            print("✅ Redis Connection Successful")
            results["Redis"] = True
            await redis.close()
    except Exception as e:
        print(f"❌ Redis Failed: {e}")

    # 3. SMTP
    print("\n--- Checking SMTP ---")
    try:
        host = os.getenv("SMTP_HOST")
        port = int(os.getenv("SMTP_PORT", 587))
        user = os.getenv("SMTP_USER")
        password = os.getenv("SMTP_PASSWORD")
        
        if not user or not password:
            print("❌ SMTP credentials missing in .env")
        else:
            server = smtplib.SMTP(host, port, timeout=5)
            server.starttls()
            server.login(user, password)
            print("✅ SMTP Login Successful")
            results["SMTP"] = True
            server.quit()
    except Exception as e:
        print(f"❌ SMTP Failed: {e}")

    print("\n=== SUMMARY ===")
    all_passed = True
    for service, status in results.items():
        icon = '✅' if status else '❌'
        print(f"{service}: {icon} {'OK' if status else 'FAILED'}")
        if not status: all_passed = False
    
    return all_passed

if __name__ == "__main__":
    asyncio.run(verify())
