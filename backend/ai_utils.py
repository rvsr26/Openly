import os
import requests
from dotenv import load_dotenv
import re
from collections import Counter
import google.generativeai as genai
import json

# 1. Load Environment Variables
load_dotenv()

# 2. Configure Gemini
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    # Using gemini-1.5-flash for speed and multi-modal support
    model = genai.GenerativeModel('gemini-1.5-flash')
else:
    print("⚠️ Warning: GEMINI_API_KEY not found. Falling back to basic AI logic.")
    model = None

def is_toxic(text: str) -> bool:
    """
    Advanced toxicity detection using Gemini.
    Returns True if the text contains hate speech, harassment, or extreme insults.
    """
    if not model:
        # Fallback to simple bad words
        bad_words = ["hate", "kill", "stupid", "fuck", "bitch"]
        return any(word in text.lower() for word in bad_words)

    prompt = f"""
    Analyze the following text for toxicity. 
    Respond with ONLY a JSON object: {{"is_toxic": true/false, "reason": "short reason"}}.
    Criteria: hate speech, harassment, threats, or severe insults.
    
    Text: "{text}"
    """
    
    try:
        response = model.generate_content(prompt)
        # Attempt to parse JSON from response
        try:
            # Clean possible markdown formatting
            clean_text = response.text.strip().replace('```json', '').replace('```', '')
            data = json.loads(clean_text)
            return data.get("is_toxic", False)
        except:
            # Simple substring check if JSON parsing fails
            return "true" in response.text.lower()
    except Exception as e:
        print(f"Gemini Toxicity Check Error: {e}")
        return False

def extract_keywords(text: str) -> list:
    """
    Extracts top keywords/topics using Gemini.
    """
    if not text or len(text) < 5:
        return []

    if not model:
        # Fallback to simple frequency analysis
        words = re.findall(r'\b\w{4,}\b', text.lower())
        stopwords = {"the", "and", "that", "this", "with", "from", "they", "will"}
        filtered = [w for w in words if w not in stopwords]
        return [w for w, c in Counter(filtered).most_common(5)]

    prompt = f"Extract exactly 5 core keywords or topics from this text. Respond ONLY with a comma-separated list. \n\nText: {text}"
    
    try:
        response = model.generate_content(prompt)
        keywords = [k.strip() for k in response.text.split(',')]
        return keywords[:5]
    except Exception as e:
        print(f"Gemini Keyword Extraction Error: {e}")
        return []

def summarize_text(text: str) -> str:
    """
    Summarizes text using Gemini.
    """
    if not text or len(text) < 100:
        return text

    if not model:
        return text[:150] + "..."

    prompt = f"Summarize this text in 2-3 concise sentences: \n\n{text}"
    
    try:
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        print(f"Gemini Summarization Error: {e}")
        return text

def get_sentiment(text: str) -> str:
    """
    Returns the sentiment of the text: "POSITIVE", "NEGATIVE", or "NEUTRAL".
    """
    if not model:
        return "NEUTRAL"

    prompt = f"Classify the sentiment of this text as POSITIVE, NEGATIVE, or NEUTRAL. Respond with ONLY the label. \n\nText: {text}"
    
    try:
        response = model.generate_content(prompt)
        sentiment = response.text.strip().upper()
        if sentiment in ["POSITIVE", "NEGATIVE", "NEUTRAL"]:
            return sentiment
        return "NEUTRAL"
    except Exception as e:
        print(f"Gemini Sentiment Error: {e}")
        return "NEUTRAL"

async def enhance_content(content: str, title: str = "") -> dict:
    """
    Heavily refines and improves content for a post.
    """
    if not model:
        return {"content": content, "title": title, "tags": []}

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
    
    try:
        response = model.generate_content(prompt)
        clean_text = response.text.strip().replace('```json', '').replace('```', '')
        return json.loads(clean_text)
    except Exception as e:
        print(f"Gemini Content Enhancement Error: {e}")
        return {"content": content, "title": title, "tags": []}

async def cluster_tags(unique_tags: list) -> dict:
    """
    Groups a list of unique tags into logical themes using Gemini.
    Returns: { "Themes": { "ThemeName": ["tag1", "tag2"], ... }, "Uncategorized": [...] }
    """
    if not model or not unique_tags:
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
    
    try:
        response = model.generate_content(prompt)
        clean_text = response.text.strip().replace('```json', '').replace('```', '')
        return json.loads(clean_text)
    except Exception as e:
        print(f"Gemini Tag Clustering Error: {e}")
        return {"Themes": {"General": unique_tags}, "Uncategorized": []}
