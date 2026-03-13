
import os
import requests
import json
from dotenv import load_dotenv

load_dotenv()
key = os.getenv("GEMINI_API_KEY")

results = {}
models = ["gemini-1.5-flash", "gemini-2.0-flash-exp", "gemini-pro", "gemini-1.5-pro"]

for m in models:
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{m}:generateContent?key={key}"
    payload = {"contents": [{"parts": [{"text": "hi"}]}]}
    try:
        r = requests.post(url, json=payload, timeout=10)
        results[m] = {
            "status": r.status_code,
            "response": r.text[:500]
        }
    except Exception as e:
        results[m] = {"error": str(e)}

with open("model_test_final.txt", "w") as f:
    json.dump(results, f, indent=2)
