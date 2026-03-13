
import os
import sys
from dotenv import load_dotenv

results = []
results.append("--- Diagnostic Start ---")
load_dotenv()
key = os.getenv("GEMINI_API_KEY")
results.append(f"GEMINI_API_KEY found: {'Yes' if key else 'No'}")
if key:
    results.append(f"Key starts with: {key[:10]}...")

try:
    import google.generativeai as genai
    results.append("google.generativeai import: SUCCESS")
except Exception as e:
    results.append(f"google.generativeai import: FAILED - {e}")

results.append(f"Python version: {sys.version}")
results.append("--- Diagnostic End ---")

with open("diag_results.txt", "w") as f:
    f.write("\n".join(results))
