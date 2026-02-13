import requests
import time

BASE_URL = "http://127.0.0.1:8000"

def test_suggested():
    print("Testing /users/suggested...")
    try:
        # Test 1: No user_id (should work and use None)
        res = requests.get(f"{BASE_URL}/users/suggested")
        print(f"Stats (No Param): {res.status_code}")
        if res.status_code == 200:
            print("Response:", len(res.json()), "users")
        else:
            print("Error:", res.text)

        # Test 2: Empty user_id param (simulating frontend issue)
        res = requests.get(f"{BASE_URL}/users/suggested?user_id=")
        print(f"Stats (Empty Param): {res.status_code}")
        if res.status_code == 200:
            print("Response:", len(res.json()), "users")
        else:
             print("Error:", res.text)

    except Exception as e:
        print(f"Request failed: {e}")

def test_auth_sync():
    print("\nTesting /api/v1/auth/sync...")
    try:
        payload = {
            "uid": "test_user_verify_fix",
            "email": "test_verify@example.com",
            "display_name": "Test Verify",
            "photoURL": ""
        }
        res = requests.post(f"{BASE_URL}/api/v1/auth/sync", json=payload)
        print(f"Status: {res.status_code}")
        if res.status_code == 200:
            print("Token received:", res.json().get("access_token") is not None)
            print(res.json())
        else:
             print("Error:", res.text)
    except Exception as e:
        print(f"Request failed: {e}")

if __name__ == "__main__":
    # Wait a bit for server to be fully ready if just started
    time.sleep(2)
    test_suggested()
    test_auth_sync()
