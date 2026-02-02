import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timedelta
import math

async def test_hot_algo():
    # Connect to local MongoDB (assuming default docker compose setup)
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.openly
    collection = db.posts_collection
    
    print("--- Cleaning up test data ---")
    await collection.delete_many({"test": True})
    
    print("--- Inserting test posts ---")
    now = datetime.utcnow()
    
    # Post A: New, 1 reaction (Score ~ now/45000)
    post_a = {
        "content": "Post A: Fresh (1 react)",
        "reaction_count": 1,
        "created_at": now.isoformat(),
        "is_rejected": False,
        "test": True
    }
    
    # Post B: 12.5h old, 20 reactions (log(20) = 1.3, Score = 1.3 + (now-12.5)/45 = 1.3 + now/45 - 1 = 0.3 + now/45)
    # 0.3 + now/45 > now/45. So B > A.
    post_b = {
        "content": "Post B: Mid-age (20 reacts)",
        "reaction_count": 20,
        "created_at": (now - timedelta(hours=12.5)).isoformat(),
        "is_rejected": False,
        "test": True
    }
    
    # Post C: 48h old, 1000 reactions (log(1000) = 3, Score = 3 + (now-48)/45 = 3 + now/45 - 1.06 = 1.94 + now/45)
    # C > B > A.
    post_c = {
        "content": "Post C: Old but Viral (1000 reacts)",
        "reaction_count": 1000,
        "created_at": (now - timedelta(hours=48)).isoformat(),
        "is_rejected": False,
        "test": True
    }
    
    await collection.insert_many([post_a, post_b, post_c])
    
    print("--- Running aggregation ---")
    pipeline = [
        {"$match": {"test": True, "is_rejected": False}},
        {
            "$addFields": {
                "ts": {"$toLong": {"$dateFromString": {"dateString": "$created_at"}}}
            }
        },
        {
            "$addFields": {
                "hot_score": {
                    "$add": [
                        {"$log10": {"$max": ["$reaction_count", 1]}},
                        {"$divide": ["$ts", 45000000.0]} 
                    ]
                }
            }
        },
        {"$sort": {"hot_score": -1}}
    ]
    
    results = await collection.aggregate(pipeline).to_list(length=10)
    
    print("\nResults (Ordered by Hot Score):")
    for i, r in enumerate(results):
        print(f"{i+1}. {r['content']} | Reactions: {r['reaction_count']} | Score: {r['hot_score']}")
    
    await collection.delete_many({"test": True})
    print("\n--- Cleanup complete ---")

if __name__ == "__main__":
    asyncio.run(test_hot_algo())
