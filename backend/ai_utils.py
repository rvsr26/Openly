import os
import requests
import httpx
import json
import re
from collections import Counter
from dotenv import load_dotenv

# 1. Load Environment Variables
load_dotenv()

# 2. Configure Gemini REST
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
# Using the discovered working model name
MODEL_FULL_NAME = "models/gemini-2.5-flash"
BASE_URL = f"https://generativelanguage.googleapis.com/v1beta/{MODEL_FULL_NAME}:generateContent"

if not GEMINI_API_KEY:
    print("[WARNING] GEMINI_API_KEY not found. AI features will use basic fallback logic.")

def _call_gemini_sync(prompt: str) -> str:
    """Helper to call Gemini REST API synchronously."""
    if not GEMINI_API_KEY:
        return ""
    
    try:
        url = f"{BASE_URL}?key={GEMINI_API_KEY}"
        payload = {
            "contents": [{
                "parts": [{"text": prompt}]
            }]
        }
        response = requests.post(url, json=payload, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        # Extract text from response structure
        return data['candidates'][0]['content']['parts'][0]['text']
    except Exception as e:
        print(f"[ERROR] Gemini REST Sync Error: {e}")
        return ""

async def _call_gemini_async(prompt: str) -> str:
    """Helper to call Gemini REST API asynchronously."""
    if not GEMINI_API_KEY:
        return ""
    
    try:
        url = f"{BASE_URL}?key={GEMINI_API_KEY}"
        payload = {
            "contents": [{
                "parts": [{"text": prompt}]
            }]
        }
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=payload, timeout=15)
            response.raise_for_status()
            data = response.json()
            return data['candidates'][0]['content']['parts'][0]['text']
    except Exception as e:
        print(f"[ERROR] Gemini REST Async Error: {e}")
        return ""

def is_toxic(text: str) -> bool:
    """Advanced toxicity detection using Gemini REST API."""
    if not GEMINI_API_KEY:
        bad_words = ["hate", "kill", "stupid", "fuck", "bitch"]
        return any(word in text.lower() for word in bad_words)

    prompt = f"""
    Analyze the following text for toxicity. 
    Respond with ONLY a JSON object: {{"is_toxic": true/false, "reason": "short reason"}}.
    Criteria: hate speech, harassment, threats, or severe insults.
    
    Text: "{text}"
    """
    
    response_text = _call_gemini_sync(prompt)
    if not response_text:
        return False
        
    try:
        # Clean possible markdown formatting
        clean_text = response_text.strip().replace('```json', '').replace('```', '')
        # Handle cases where the text might contain other characters
        if '{' in clean_text:
            clean_text = clean_text[clean_text.find('{'):clean_text.rfind('}')+1]
        data = json.loads(clean_text)
        return data.get("is_toxic", False)
    except:
        return "true" in response_text.lower()

def extract_keywords(text: str) -> list:
    """Extracts top keywords/topics using Gemini REST API."""
    if not text or len(text) < 5:
        return []

    if not GEMINI_API_KEY:
        words = re.findall(r'\b\w{4,}\b', text.lower())
        stopwords = {"the", "and", "that", "this", "with", "from", "they", "will"}
        filtered = [w for w in words if w not in stopwords]
        return [w for w, c in Counter(filtered).most_common(5)]

    prompt = f"Extract exactly 5 core keywords or topics from this text. Respond ONLY with a comma-separated list. \n\nText: {text}"
    
    response_text = _call_gemini_sync(prompt)
    if not response_text:
        return []
        
    try:
        # Split and clean
        keywords = [k.strip() for k in response_text.replace('\n', ',').split(',')]
        return [k for k in keywords if k][:5]
    except Exception as e:
        print(f"Keyword Extraction Error: {e}")
        return []

def summarize_text(text: str) -> str:
    """Summarizes text using Gemini REST API."""
    if not text or len(text) < 100:
        return text

    if not GEMINI_API_KEY:
        return text[:150] + "..."

    prompt = f"Summarize this text in 2-3 concise sentences: \n\n{text}"
    
    response_text = _call_gemini_sync(prompt)
    return response_text.strip() if response_text else text[:150] + "..."

def get_sentiment(text: str) -> str:
    """Returns the sentiment: POSITIVE, NEGATIVE, or NEUTRAL."""
    if not GEMINI_API_KEY:
        return "NEUTRAL"

    prompt = f"Classify the sentiment of this text as POSITIVE, NEGATIVE, or NEUTRAL. Respond with ONLY the label. \n\nText: {text}"
    
    response_text = _call_gemini_sync(prompt)
    if not response_text:
        return "NEUTRAL"
        
    sentiment = response_text.strip().upper()
    if "POSITIVE" in sentiment: return "POSITIVE"
    if "NEGATIVE" in sentiment: return "NEGATIVE"
    return "NEUTRAL"

async def enhance_content(content: str, title: str = "") -> dict:
    """Heavily refines and improves content for a post."""
    if not GEMINI_API_KEY:
        return {"enhanced_title": title, "enhanced_content": content, "suggested_tags": []}

    prompt = f"""
    The following is a draft post for a professional social network called 'Openly'. 
    Please enhance the title and content to be more engaging, professional, and clear.
    Also suggest 5 relevant tags.
    
    Respond with ONLY a JSON object:
    {{
      "enhanced_title": "...",
      "enhanced_content": "...",
      "suggested_tags": ["tag1", "tag2", ...]
    }}
    
    Title: {title}
    Content: {content}
    """
    
    response_text = await _call_gemini_async(prompt)
    if not response_text:
        return {"enhanced_title": title, "enhanced_content": content, "suggested_tags": []}
        
    try:
        clean_text = response_text.strip().replace('```json', '').replace('```', '')
        if '{' in clean_text:
            clean_text = clean_text[clean_text.find('{'):clean_text.rfind('}')+1]
        return json.loads(clean_text)
    except Exception as e:
        print(f"Content Enhancement Error: {e}")
        return {"enhanced_title": title, "enhanced_content": content, "enhanced_tags": []}

async def cluster_tags(unique_tags: list) -> dict:
    """Groups tags into logical themes using Gemini REST API."""
    if not GEMINI_API_KEY or not unique_tags:
        return {"Themes": {"General": unique_tags}, "Uncategorized": []}

    prompt = f"""
    You are a data scientist analyzing professional social media data.
    Group the following list of unique tags into exactly 5-8 logical high-level themes.
    Tags that don't fit should go into 'Uncategorized'.
    
    Respond with ONLY a JSON object:
    {{
      "Themes": {{
        "Theme Name (e.g. Engineering)": ["tag1", "tag2", ...],
        ...
      }},
      "Uncategorized": ["tagX", ...]
    }}
    
    Tags: {", ".join(unique_tags)}
    """
    
    response_text = await _call_gemini_async(prompt)
    if not response_text:
        return {"Themes": {"General": unique_tags}, "Uncategorized": []}
        
    try:
        clean_text = response_text.strip().replace('```json', '').replace('```', '')
        if '{' in clean_text:
            clean_text = clean_text[clean_text.find('{'):clean_text.rfind('}')+1]
        return json.loads(clean_text)
    except Exception as e:
        print(f"Tag Clustering Error: {e}")
        return {"Themes": {"General": unique_tags}, "Uncategorized": []}
