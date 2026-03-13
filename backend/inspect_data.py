
import asyncio
from database import posts_collection
from bson import ObjectId

async def inspect():
    print("Inspecting latest posts...")
    cursor = posts_collection.find().sort("created_at", -1).limit(5)
    async for doc in cursor:
        print(f"ID: {doc.get('_id')}")
        print(f"Created At: {doc.get('created_at')} (Type: {type(doc.get('created_at'))})")
        print(f"Reaction Count: {doc.get('reaction_count')} (Type: {type(doc.get('reaction_count'))})")
        print("-" * 20)

if __name__ == "__main__":
    asyncio.run(inspect())
