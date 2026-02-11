import os
import requests
from dotenv import load_dotenv
import re
from collections import Counter

# 1. Load Environment Variables
load_dotenv()

# 2. Get the Key securely
HF_TOKEN = os.getenv("HUGGINGFACE_API_KEY")

# Model URL (A popular model for detecting toxicity/hate speech)
API_URL = "https://api-inference.huggingface.co/models/s-nlp/roberta_toxicity_classifier"

def is_toxic(text: str) -> bool:
    """
    Returns True if the AI thinks the text is toxic/insulting.
    """
    if not HF_TOKEN:
        print("⚠️ Warning: No Hugging Face Key found. AI check skipped.")
        return False

    headers = {"Authorization": f"Bearer {HF_TOKEN}"}
    payload = {"inputs": text}

    try:
        response = requests.post(API_URL, headers=headers, json=payload)
        data = response.json()

        # The API returns a list of lists, e.g., [[{'label': 'toxic', 'score': 0.9}, ...]]
        # We check if the 'toxic' label has a high confidence score (> 0.7)
        if isinstance(data, list) and len(data) > 0:
            scores = data[0] # The first classification result
            # Sort by score just in case, or find the 'toxic' label
            for label_data in scores:
                if label_data['label'] == 'toxic' and label_data['score'] > 0.7:
                    return True
                
        # Fallback: Simple "Bad Word" list if AI fails or limits hit
        bad_words = ["hate", "kill", "stupid"]
        if any(word in text.lower() for word in bad_words):
            return True

    except Exception as e:
        print(f"AI Error: {e}")
        return False
        
    return False

def extract_keywords(text: str) -> list:
    """
    Extracts top keywords from text using simple frequency analysis.
    """
    if not text or len(text) < 10:
        return []

    try:
        # Simple stopword list
        stopwords = {
            "the", "a", "an", "and", "or", "but", "is", "are", "was", "were",
            "in", "on", "at", "to", "for", "with", "by", "from", "of", "that",
            "this", "these", "those", "it", "he", "she", "they", "we", "you",
            "i", "me", "my", "your", "his", "her", "their", "our", "us", "be",
            "been", "being", "have", "has", "had", "do", "does", "did", "can",
            "could", "should", "would", "will", "may", "might", "must", "not",
            "no", "yes", "if", "then", "else", "when", "where", "why", "how",
            "all", "any", "some", "few", "many", "more", "most", "other", "such",
            "so", "as", "than", "just", "about", "up", "out", "down", "over",
            "under", "into", "through", "after", "before", "while", "until"
        }

        # Normalize text: lowercase and remove non-alphanumeric characters
        words = re.findall(r'\b\w+\b', text.lower())
        
        # Filter out stopwords and short words
        filtered_words = [w for w in words if w not in stopwords and len(w) > 2]
        
        # Count frequency
        counter = Counter(filtered_words)
        
        # Get top 5 most common words
        most_common = counter.most_common(5)
        
        return [word for word, count in most_common]
    except Exception as e:
        print(f"Keyword Extraction Error: {e}")
        return []