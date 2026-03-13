
import os
import requests
from dotenv import load_dotenv

load_dotenv()
key = os.getenv("GEMINI_API_KEY")
model = "gemini-1.5-flash"
url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key}"

payload = {
    "contents": [{
        "parts": [{"text": "Say hello"}]
    }]
}

try:
    response = requests.post(url, json=payload)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        print(f"Response: {response.json()['candidates'][0]['content']['parts'][0]['text']}")
    else:
        print(f"Error: {response.text}")
except Exception as e:
    print(f"Exception: {e}")
