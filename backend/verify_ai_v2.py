
import asyncio
import os
import json
from ai_utils import is_toxic, extract_keywords, summarize_text, get_sentiment, enhance_content

async def verify_ai():
    results = []
    results.append("--- AI Verification Start ---")
    
    test_text = "I am so happy and excited to be part of this amazing community!"
    toxic_text = "You are so stupid and I hate you so much, kill yourself." # Purposely toxic for test
    
    results.append(f"Testing Toxicity (Clean): {is_toxic(test_text)}")
    results.append(f"Testing Toxicity (Toxic): {is_toxic(toxic_text)}")
    
    keywords = extract_keywords(test_text)
    results.append(f"Keywords: {keywords}")
    
    summary = summarize_text(test_text)
    results.append(f"Summary: {summary}")
    
    sentiment = get_sentiment(test_text)
    results.append(f"Sentiment: {sentiment}")
    
    enhanced = await enhance_content("This is my first post here.", "Hello")
    results.append(f"Enhanced Result Content: {enhanced.get('enhanced_content', 'FAILED')[:50]}...")
    
    results.append("--- AI Verification End ---")
    
    with open("ai_final_results.txt", "w") as f:
        f.write("\n".join(results))

if __name__ == "__main__":
    asyncio.run(verify_ai())
