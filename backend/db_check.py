import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def run():
    client = AsyncIOMotorClient('mongodb://127.0.0.1:27017')
    db = client['openly']
    
    # Check users collection
    u = await db.users.find_one({'username': 'tester1'})
    print("USER photoURL:", u.get('photoURL') if u else "Not Found")
    
    # Check posts collection
    p = db.posts.find({'username': '@tester1'})
    async for post in p:
        print("POST user_pic:", post.get('user_pic'))

asyncio.run(run())
