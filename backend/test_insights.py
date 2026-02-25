import asyncio
from database import users_collection
from insights import send_insight_report

async def test():
    user = await users_collection.find_one({})
    if not user:
        print('No user found.')
        return
    res = await send_insight_report(str(user['_id']), user.get('email', 'test@example.com'), user.get('username', 'TestUser'))
    print(res)

if __name__ == "__main__":
    asyncio.run(test())
