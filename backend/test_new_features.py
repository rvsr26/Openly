import requests
import json

API_URL = "http://127.0.0.1:8000"

def test_trending():
    print("--- Testing Trending Posts ---")
    try:
        response = requests.get(f"{API_URL}/api/v1/trending/posts")
        if response.status_code == 200:
            posts = response.json()
            print(f"Found {len(posts)} trending posts.")
            for p in posts:
                print(f"- {p.get('title') or p.get('content')[:50]}")
        else:
            print(f"Failed: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"Error: {e}")

    print("\n--- Testing Trending Tags ---")
    try:
        response = requests.get(f"{API_URL}/api/v1/trending/tags")
        if response.status_code == 200:
            tags = response.json()
            print(f"Found {len(tags)} trending tags.")
            for t in tags:
                print(f"- {t.get('tag')} ({t.get('count')} posts)")
        else:
            print(f"Failed: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"Error: {e}")

def test_summarize():
    print("\n--- Testing Post Summarization ---")
    try:
        # Get a long post first
        feed_res = requests.get(f"{API_URL}/feed/")
        posts = feed_res.json()
        long_post = next((p for p in posts if len(p.get('content', '')) > 200), None)
        
        if not long_post:
            print("No long post found to summarize. Using a shorter one.")
            long_post = posts[0] if posts else None
            
        if long_post:
            post_id = long_post.get('id')
            print(f"Summarizing post ID: {post_id}")
            print(f"Original content length: {len(long_post.get('content'))}")
            
            sum_res = requests.get(f"{API_URL}/api/v1/posts/{post_id}/summarize")
            if sum_res.status_code == 200:
                summary = sum_res.json().get('summary')
                print(f"Summary: {summary}")
            else:
                print(f"Failed to summarize: {sum_res.status_code} - {sum_res.text}")
        else:
            print("No posts found in feed.")
    except Exception as e:
        print(f"Error: {e}")

def test_suggest_tags():
    print("\n--- Testing Tag Suggestions ---")
    try:
        content = "The new renewable energy project in the Sahara desert is expected to provide power to millions of homes by 2030."
        response = requests.get(f"{API_URL}/api/v1/posts/suggest-tags?content={requests.utils.quote(content)}")
        if response.status_code == 200:
            tags = response.json().get('tags')
            print(f"Suggested tags: {tags}")
        else:
            print(f"Failed: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_trending()
    test_summarize()
    test_suggest_tags()
