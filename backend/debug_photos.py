import asyncio
from database import users_collection, posts_collection
import os

async def run():
    # Check current user from logs
    uid = "RKMISolVsMM7dWTpLa2A3ILBqb32"
    u = await users_collection.find_one({'_id': uid})
    
    print(f"--- USER DEBUG ({uid}) ---")
    if u:
        print(f"ID: {u.get('_id')} (Type: {type(u.get('_id'))})")
        print(f"Username: {u.get('username')}")
        print(f"photoURL: {u.get('photoURL')}")
    else:
        print("User not found")
        
    print("\n--- POSTS DEBUG ---")
    p_cursor = posts_collection.find({'user_id': uid}).limit(1)
    async for post in p_cursor:
        p_uid = post.get('user_id')
        print(f"Post ID: {post.get('_id')}")
        print(f"  user_id in post: {p_uid} (Type: {type(p_uid)})")
        print(f"  stored user_pic: {post.get('user_pic')}")

    # ALSO check comments
    from database import comments_collection
    c_cursor = comments_collection.find({'user_id': uid}).limit(1)
    async for comment in c_cursor:
        c_uid = comment.get('user_id')
        print(f"\n--- COMMENT DEBUG ---")
        print(f"Comment ID: {comment.get('_id')}")
        print(f"  user_id in comment: {c_uid} (Type: {type(c_uid)})")
        print(f"  stored user_pic: {comment.get('user_pic')}")

if __name__ == "__main__":
    asyncio.run(run())
