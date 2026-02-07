import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timedelta

async def test_top_algo():
    # Connect to local MongoDB
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.failure_db
    collection = db.posts
    
    print("--- Cleaning up test data ---")
    await collection.delete_many({"test": "wilson"})
    
    print("--- Inserting test posts ---")
    now = datetime.utcnow()
    
    # Post 1: 1000 reactions, 0 reports (Very High confidence)
    # Post 2: 100 reactions, 0 reports (High confidence)
    # Post 3: 1000 reactions, 50 reports (High but penalized)
    # Post 4: 1 reaction, 0 reports (Low confidence)
    
    posts = [
        {"content": "Post 1: 1000R, 0Rep", "reaction_count": 1000, "report_count": 0, "test": "wilson", "created_at": now.isoformat(), "is_rejected": False},
        {"content": "Post 2: 100R, 0Rep", "reaction_count": 100, "report_count": 0, "test": "wilson", "created_at": now.isoformat(), "is_rejected": False},
        {"content": "Post 3: 1000R, 50Rep", "reaction_count": 1000, "report_count": 50, "test": "wilson", "created_at": now.isoformat(), "is_rejected": False},
        {"content": "Post 4: 1R, 0Rep", "reaction_count": 1, "report_count": 0, "test": "wilson", "created_at": now.isoformat(), "is_rejected": False},
    ]
    
    await collection.insert_many(posts)
    
    print("--- Running Wilson Score aggregation ---")
    z = 1.96
    z2 = z * z
    pipeline = [
        {"$match": {"test": "wilson", "is_rejected": False}},
        {
            "$addFields": {
                "n": {"$add": ["$reaction_count", "$report_count"]}
            }
        },
        {
            "$addFields": {
                "top_score": {
                    "$cond": {
                        "if": {"$gt": ["$n", 0]},
                        "then": {
                            "$let": {
                                "vars": {
                                    "p": {"$divide": ["$reaction_count", "$n"]}
                                },
                                "in": {
                                    "$divide": [
                                        {"$subtract": [
                                            {"$add": ["$$p", {"$divide": [z2, {"$multiply": [2, "$n"]}]}]},
                                            {"$multiply": [
                                                z,
                                                {"$sqrt": {"$add": [
                                                    {"$divide": [{"$multiply": ["$$p", {"$subtract": [1, "$$p"]}]}, "$n"]},
                                                    {"$divide": [z2, {"$multiply": [4, {"$pow": ["$n", 2]}]}]}
                                                ]}}
                                            ]}
                                        ]},
                                        {"$add": [1, {"$divide": [z2, "$n"]}]}
                                    ]
                                }
                            }
                        },
                        "else": 0
                    }
                }
            }
        },
        {"$sort": {"top_score": -1}}
    ]
    
    results = await collection.aggregate(pipeline).to_list(length=10)
    
    print("\nResults (Ordered by Wilson Score):")
    for i, r in enumerate(results):
        print(f"{i+1}. {r['content']} | R: {r['reaction_count']} | Rep: {r['report_count']} | Score: {r['top_score']:.4f}")
    
    await collection.delete_many({"test": "wilson"})
    print("\n--- Cleanup complete ---")

if __name__ == "__main__":
    asyncio.run(test_top_algo())
