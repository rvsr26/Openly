import sys
import os
import requests
import json

# Ensure we can import from local directory
sys.path.append(os.getcwd())

try:
    from ai_utils import extract_keywords
    print("--- Testing Utility Function ---")
    text = "I failed my math exam because I didn't study enough for the calculus section."
    keywords = extract_keywords(text)
    print(f"Text: {text}")
    print(f"Keywords: {keywords}")

    text2 = "Startup funding is really hard to get these days. Investors are looking for profitability."
    keywords2 = extract_keywords(text2)
    print(f"Text: {text2}")
    print(f"Keywords: {keywords2}")
    print("\n")
except ImportError:
    print("Could not import ai_utils. Make sure you are running in the correct directory.")
except Exception as e:
    print(f"Utility test error: {e}")

print("--- Testing API Endpoint ---")
API_URL = "http://127.0.0.1:8000"
POST_URL = f"{API_URL}/posts/"

# Payload with NO tags
payload = {
    "user_id": "generic_user_id", # Backend handles missing user gracefully
    "user_name": "Test User",
    "content": "I crashed the production database by running a drop table command without a where clause. It was a disaster.",
    "tags": [] 
}

try:
    response = requests.post(POST_URL, json=payload)
    if response.status_code == 200:
        data = response.json()
        print(f"Post created successfully. ID: {data.get('id')}")
        
        # Now fetch the post to verify tags
        post_id = data.get('id')
        if post_id:
            get_response = requests.get(f"{API_URL}/posts/{post_id}")
            if get_response.status_code == 200:
                post_data = get_response.json()
                print(f"Fetched Post Tags: {post_data.get('tags')}")
            else:
                print(f"Failed to fetch post: {get_response.text}")
    else:
        print(f"Failed to create post: {response.status_code} - {response.text}")

except Exception as e:
    print(f"API Connection Error: {e}")
