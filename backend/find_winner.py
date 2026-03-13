
import os
import requests
from dotenv import load_dotenv

load_dotenv()
key = os.getenv("GEMINI_API_KEY")
list_url = f"https://generativelanguage.googleapis.com/v1beta/models?key={key}"

try:
    r = requests.get(list_url)
    models = [m['name'] for m in r.json().get('models', []) if 'generateContent' in m.get('supportedGenerationMethods', [])]
    print(f"Testing {len(models)} models...")
    
    for full_name in models:
        # full_name is already "models/xxx"
        url = f"https://generativelanguage.googleapis.com/v1beta/{full_name}:generateContent?key={key}"
        payload = {"contents": [{"parts": [{"text": "hi"}]}]}
        resp = requests.post(url, json=payload)
        print(f"Model: {full_name} | Status: {resp.status_code}")
        if resp.status_code == 200:
            print(f"SUCCESS with {full_name}!")
            # Save the winner
            with open("winner_model.txt", "w") as f:
                f.write(full_name)
            break
except Exception as e:
    print(f"Exception: {e}")
