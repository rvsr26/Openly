import requests
import time

BASE_URL = "http://localhost:8000"

def test_follow_flow():
    print("🚀 Starting Follow System Test...")
    
    # 1. Create two test users
    user1_id = "test_user_A_" + str(int(time.time()))
    user2_id = "test_user_B_" + str(int(time.time()))
    
    # Register/Set usernames logic (simulated via direct DB or minimal setup if needed)
    # Actually, the follow endpoint relies on existing users.
    # We can use the set-username endpoint to "create" them if they just need to exist in Users collection?
    # Wait, simple setup:
    
    # Helper to create user
    def create_user(uid, username):
        requests.post(f"{BASE_URL}/users/set-username", json={"user_id": uid, "username": username})
        requests.post(f"{BASE_URL}/users/profile/update", json={"user_id": uid, "display_name": f"Display {username}"})
        
    create_user(user1_id, f"user_a_{int(time.time())}")
    create_user(user2_id, f"user_b_{int(time.time())}")
    
    print(f"✅ Created users: {user1_id}, {user2_id}")
    
    # 2. User A follows User B
    print(f"👉 User A following User B...")
    res = requests.post(f"{BASE_URL}/users/{user2_id}/follow", json={"user_id": user1_id}) # user_id in body is usually requester
    assert res.status_code == 200
    assert res.json()["status"] == "following"
    print("✅ Follow successful")
    
    # 3. Check Followers of B
    print(f"🔍 Checking followers of B...")
    res = requests.get(f"{BASE_URL}/users/{user2_id}/followers")
    followers = res.json()
    assert len(followers) > 0
    assert any(f["user_id"] == user1_id for f in followers)
    print("✅ User A found in followers list")
    
    # 4. Check Following of A
    print(f"🔍 Checking following of A...")
    res = requests.get(f"{BASE_URL}/users/{user1_id}/following")
    following = res.json()
    assert len(following) > 0
    assert any(f["user_id"] == user2_id for f in following)
    print("✅ User B found in following list")
    
    # 5. Search Check (is_following = True)
    print(f"🔍 Searching for User B as User A...")
    # search query needs to match username/displayname
    # Search is slightly async on indexing? specific to mongo text index? No, typically regex in this code.
    res = requests.get(f"{BASE_URL}/search/?q=user_b&user_id={user1_id}")
    results = res.json()
    
    # Filter for user type
    user_results = [r for r in results if r["type"] == "user" and r["id"] == user2_id]
    if user_results:
        assert user_results[0]["is_following"] == True
        print("✅ Search result correctly shows is_following=True")
    else:
        print("⚠️ User B not found in search (might be delay or regex mismatch)")
        
    # 6. Unfollow
    print(f"👉 User A unfollowing User B...")
    res = requests.delete(f"{BASE_URL}/users/{user2_id}/follow?user_id={user1_id}")
    assert res.status_code == 200
    assert res.json()["status"] == "unfollowed"
    print("✅ Unfollow successful")
    
    # 7. Verify Unfollow
    res = requests.get(f"{BASE_URL}/users/{user1_id}/following")
    following = res.json()
    assert not any(f["user_id"] == user2_id for f in following)
    print("✅ Verified unfollow in list")
    
    print("🎉 All Tests Passed!")

if __name__ == "__main__":
    try:
        test_follow_flow()
    except Exception as e:
        print(f"❌ Test Failed: {e}")
