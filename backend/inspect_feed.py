import requests
import json

try:
    res = requests.get("http://127.0.0.1:8000/feed/")
    data = res.json()
    if data:
        print(f"Number of posts: {len(data)}")
        first_post = data[0]
        print("Keys in first post:", list(first_post.keys()))
        print("user_name:", first_post.get("user_name"))
        print("user_pic:", first_post.get("user_pic"))
        print("author_pic:", first_post.get("author_pic"))
        print("username:", first_post.get("username"))
        print("is_anonymous:", first_post.get("is_anonymous"))
    else:
        print("Feed is empty.")
except Exception as e:
    print(f"Error: {e}")
