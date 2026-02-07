import requests
import json
import sys

BASE_URL = "http://localhost:8000"

def check_keys(obj, required_keys, name):
    missing = [k for k in required_keys if k not in obj]
    if missing:
        print(f"[FAIL] {name} missing keys: {missing}")
        return False
    print(f"[PASS] {name} has all required keys.")
    return True

def create_dummy_post():
    print(f"Creating dummy post at {BASE_URL}/posts/...")
    payload = {
        "user_id": "verify_script_user",
        "user_name": "Verify Script",
        "content": "This is a verification post.",
        "category": "Technology",
        "title": "Verification Title"
    }
    try:
        response = requests.post(f"{BASE_URL}/posts/", json=payload)
        response.raise_for_status()
        print(f"[PASS] Post created: {response.json()}")
        return response.json().get("id")
    except Exception as e:
        print(f"[ERROR] Failed to create post: {e}")
        return None

def verify_posts():
    create_dummy_post()
    
    print(f"Fetching {BASE_URL}/feed/...")
    try:
        response = requests.get(f"{BASE_URL}/feed/")
        response.raise_for_status()
        data = response.json()
        
        if not data:
            print("[WARN] No posts found to verify even after creation.")
            return

        # Expected keys based on frontend types.ts
        required_keys = [
            "id", "content", "user_id", "user_name", "category",
            "view_count", "reaction_count", "report_count", "created_at",
            "is_anonymous", "is_rejected", "is_archived"
        ]
        
        # Optional/Expected by Frontend but check if present
        details_keys = ["downvote_count", "author", "comments"]

        # Check first post
        post = data[0]
        check_keys(post, required_keys, "Post object (Core)")
        
        missing_details = [k for k in details_keys if k not in post]
        if missing_details:
             print(f"[INFO] Frontend optional/extra keys missing in Backend: {missing_details}")

        print(f"Sample Post Data: {json.dumps(post, indent=2)}")
        
    except Exception as e:
        print(f"[ERROR] Failed to fetch posts: {e}")

if __name__ == "__main__":
    verify_posts()
