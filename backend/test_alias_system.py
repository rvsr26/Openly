"""
Test script for the Anonymous Alias System
This script tests all alias CRUD operations and activation/deactivation.
"""

import requests
import json

BASE_URL = "http://localhost:8000"

# You'll need a valid JWT token from a logged-in user
# Get this by logging in through the frontend or /api/v1/auth/login endpoint
AUTH_TOKEN = "YOUR_JWT_TOKEN_HERE"

headers = {
    "Authorization": f"Bearer {AUTH_TOKEN}",
    "Content-Type": "application/json"
}

def test_create_alias():
    """Test creating a new alias"""
    print("\n=== Testing: Create Alias ===")
    data = {
        "alias_name": "Anonymous Founder",
        "alias_username": "anon_founder_123",
        "alias_type": "anonymous",
        "bio": "Sharing my startup failures anonymously"
    }
    
    response = requests.post(f"{BASE_URL}/api/v1/aliases/", json=data, headers=headers)
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    if response.status_code == 200:
        return response.json()["id"]
    return None

def test_get_all_aliases():
    """Test fetching all user aliases"""
    print("\n=== Testing: Get All Aliases ===")
    response = requests.get(f"{BASE_URL}/api/v1/aliases/", headers=headers)
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")

def test_get_alias(alias_id):
    """Test fetching a specific alias"""
    print(f"\n=== Testing: Get Alias {alias_id} ===")
    response = requests.get(f"{BASE_URL}/api/v1/aliases/{alias_id}", headers=headers)
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")

def test_update_alias(alias_id):
    """Test updating an alias"""
    print(f"\n=== Testing: Update Alias {alias_id} ===")
    data = {
        "alias_name": "Updated Anonymous Founder",
        "bio": "Updated bio for my anonymous persona"
    }
    
    response = requests.put(f"{BASE_URL}/api/v1/aliases/{alias_id}", json=data, headers=headers)
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")

def test_activate_alias(alias_id):
    """Test activating an alias"""
    print(f"\n=== Testing: Activate Alias {alias_id} ===")
    response = requests.post(f"{BASE_URL}/api/v1/aliases/{alias_id}/activate", headers=headers)
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")

def test_get_active_alias():
    """Test getting the active alias"""
    print("\n=== Testing: Get Active Alias ===")
    response = requests.get(f"{BASE_URL}/api/v1/aliases/active", headers=headers)
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")

def test_deactivate_aliases():
    """Test deactivating all aliases"""
    print("\n=== Testing: Deactivate All Aliases ===")
    response = requests.post(f"{BASE_URL}/api/v1/aliases/deactivate", headers=headers)
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")

def test_delete_alias(alias_id):
    """Test deleting an alias"""
    print(f"\n=== Testing: Delete Alias {alias_id} ===")
    response = requests.delete(f"{BASE_URL}/api/v1/aliases/{alias_id}", headers=headers)
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")

def run_all_tests():
    """Run all alias tests in sequence"""
    print("=" * 60)
    print("ALIAS SYSTEM TEST SUITE")
    print("=" * 60)
    
    # Create an alias
    alias_id = test_create_alias()
    
    if not alias_id:
        print("\n❌ Failed to create alias. Check your AUTH_TOKEN.")
        return
    
    # Get all aliases
    test_get_all_aliases()
    
    # Get specific alias
    test_get_alias(alias_id)
    
    # Update alias
    test_update_alias(alias_id)
    
    # Activate alias
    test_activate_alias(alias_id)
    
    # Get active alias
    test_get_active_alias()
    
    # Deactivate all aliases
    test_deactivate_aliases()
    
    # Verify deactivation
    test_get_active_alias()
    
    # Delete alias
    test_delete_alias(alias_id)
    
    # Verify deletion
    test_get_all_aliases()
    
    print("\n" + "=" * 60)
    print("✅ TEST SUITE COMPLETED")
    print("=" * 60)

if __name__ == "__main__":
    if AUTH_TOKEN == "YOUR_JWT_TOKEN_HERE":
        print("⚠️  Please set a valid AUTH_TOKEN in the script before running tests.")
        print("You can get a token by:")
        print("1. Logging in through the frontend")
        print("2. Using POST /api/v1/auth/login with email/password")
        print("3. Using POST /api/v1/auth/sync with Firebase UID")
    else:
        run_all_tests()
