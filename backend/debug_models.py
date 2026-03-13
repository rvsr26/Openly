
import os
import requests
from dotenv import load_dotenv

load_dotenv()
key = os.getenv("GEMINI_API_KEY")

models_to_test = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro", "gemini-2.0-flash-exp"]

for m in models_to_test:
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{m}:generateContent?key={key}"
    payload = {"contents": [{"parts": [{"text": "hi"}]}]}
    try:
        r = requests.post(url, json=payload)
        print(f"Model: {m} | Status: {r.status_code}")
        if r.status_code != 200:
            print(f"Error Body: {r.text[:200]}")
        else:
            print(f"SUCCESS with {m}!")
    except Exception as e:
        print(f"Exception for {m}: {e}")
