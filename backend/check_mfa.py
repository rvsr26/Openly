import asyncio
from database import users_collection

async def disable():
    await users_collection.update_many({'email': 'test@example.com'}, {'$set': {'two_factor_enabled': False}})
    print('MFA Disabled for test@example.com')

asyncio.run(disable())
