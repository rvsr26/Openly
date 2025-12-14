import os
import requests
from dotenv import load_dotenv

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