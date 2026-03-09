import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()
API_KEY = os.getenv("GEMINI_API_KEY")

genai.configure(api_key=API_KEY)
models = [m for m in genai.list_models() if "generateContent" in m.supported_generation_methods]
print(f"Available generateContent models:")
for m in models:
    print(f"- {m.name}")
