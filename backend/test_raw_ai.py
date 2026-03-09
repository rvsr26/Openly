import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()
API_KEY = os.getenv("GEMINI_API_KEY")
print(f"Loaded key: {API_KEY[:5]}...{API_KEY[-5:]}" if API_KEY else "No key loaded.")

try:
    genai.configure(api_key=API_KEY)
    model = genai.GenerativeModel('gemini-pro')
    print("Testing generate_content...")
    response = model.generate_content("Say exactly 'API works'")
    print("Response:", response.text)
    
    print("\nTesting chat session...")
    chat = model.start_chat()
    res = chat.send_message("Hello from chat session")
    print("Chat Response:", res.text)
except Exception as e:
    import traceback
    traceback.print_exc()
