
import asyncio
import os
from ai_utils import is_toxic, extract_keywords, summarize_text, get_sentiment, enhance_content

async def verify_ai():
    print("--- AI Verification Start ---")
    
    # Test text
    test_text = "I am so happy and excited to be part of this amazing community! It's been a great learning experience."
    toxic_text = "You are so stupid and I hate you so much, kill yourself."
    
    print(f"Testing Toxicity (Clean): {is_toxic(test_text)}")
    print(f"Testing Toxicity (Toxic): {is_toxic(toxic_text)}")
    
    keywords = extract_keywords(test_text)
    print(f"Keywords: {keywords}")
    
    summary = summarize_text(test_text)
    print(f"Summary: {summary}")
    
    sentiment = get_sentiment(test_text)
    print(f"Sentiment: {sentiment}")
    
    enhanced = await enhance_content("This is my first post here.", "Hello")
    print(f"Enhanced Result Keys: {list(enhanced.keys())}")
    print(f"Enhanced Title: {enhanced.get('enhanced_title')}")
    
    print("--- AI Verification End ---")

if __name__ == "__main__":
    asyncio.run(verify_ai())
