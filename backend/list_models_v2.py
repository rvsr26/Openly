
import os
import requests
from dotenv import load_dotenv

load_dotenv()
key = os.getenv("GEMINI_API_KEY")
url = f"https://generativelanguage.googleapis.com/v1beta/models?key={key}"

try:
    response = requests.get(url)
    if response.status_code == 200:
        models = response.json().get('models', [])
        names = [m['name'] for m in models]
        print(",".join(names[:10]))
    else:
        print(f"Error: {response.status_code}")
except Exception as e:
    print(f"Exception: {e}")
