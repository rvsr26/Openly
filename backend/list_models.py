
import os
import requests
from dotenv import load_dotenv

load_dotenv()
key = os.getenv("GEMINI_API_KEY")
url = f"https://generativelanguage.googleapis.com/v1beta/models?key={key}"

try:
    response = requests.get(url)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        models = response.json().get('models', [])
        for m in models:
            print(f"Model: {m['name']}")
    else:
        print(f"Error: {response.text}")
except Exception as e:
    print(f"Exception: {e}")
