import requests
from bson import ObjectId
import sys

BASE_URL = "http://127.0.0.1:8000"

def test_for_you():
    print("--- Testing For You Algorithm (Sync) ---")
    
    # 1. Create 3 users
    u1 = "user_1_" + str(ObjectId())
    u2 = "user_2_" + str(ObjectId())
    u3 = "user_3_" + str(ObjectId())
    
    print(f"Created Users: {u1}, {u2}, {u3}")

    # 2. Create 5 posts
    posts = []
    for i in range(5):
        payload = {
            "user_id": u1,
            "user_name": "User 1",
            "content": f"Post {i} content",
            "category": "Career"
        }
        res = requests.post(f"{BASE_URL}/posts/", json=payload)
        if res.status_code == 200:
            posts.append(res.json()["id"])
            print(f"Created Post {i}: {posts[-1]}")
        else:
            print(f"Failed to create post {i}: {res.text}")
            return

    # 3. Simulate Likes
    # User 1 likes Post 0 and Post 1
    requests.post(f"{BASE_URL}/posts/{posts[0]}/react", json={"user_id": u1})
    requests.post(f"{BASE_URL}/posts/{posts[1]}/react", json={"user_id": u1})
    
    # User 2 likes Post 0 (Similarity with User 1)
    # User 2 also likes Post 2 (Potential recommendation for User 1)
    requests.post(f"{BASE_URL}/posts/{posts[0]}/react", json={"user_id": u2})
    requests.post(f"{BASE_URL}/posts/{posts[2]}/react", json={"user_id": u2})
    
    # User 3 likes Post 4 (No similarity)
    requests.post(f"{BASE_URL}/posts/{posts[4]}/react", json={"user_id": u3})

    print("\nChecking 'For You' feed for User 1...")
    res = requests.get(f"{BASE_URL}/feed/?sort_by=for-you&user_id={u1}")
    
    if res.status_code != 200:
        print(f"Failed to fetch feed: {res.text}")
        return

    feed = res.json()
    
    print(f"Feed size: {len(feed)}")
    for p in feed:
        print(f"Recommended: {p['content']} (ID: {p['id']})")
    
    # Post 2 should be in the feed because User 2 (similar to User 1) liked it
    reco_ids = [p['id'] for p in feed]
    if posts[2] in reco_ids:
        print("\n✅ SUCCESS: Post 2 was correctly recommended to User 1!")
    else:
        print("\n❌ FAILURE: Post 2 was NOT recommended.")
        print(f"Expected {posts[2]} in {reco_ids}")

if __name__ == "__main__":
    try:
        test_for_you()
    except Exception as e:
        print(f"Error: {e}")
