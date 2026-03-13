
import os
import sys
from dotenv import load_dotenv

# Try to fix by using Python implementation of protobuf
os.environ["PROTOCOL_BUFFERS_PYTHON_IMPLEMENTATION"] = "python"

results = []
results.append("--- Diagnostic Start (with Protobuf Fix) ---")
load_dotenv()
key = os.getenv("GEMINI_API_KEY")
results.append(f"GEMINI_API_KEY found: {'Yes' if key else 'No'}")

try:
    import google.generativeai as genai
    results.append("google.generativeai import: SUCCESS")
    # Verify we can actually use it (just check attributes)
    results.append(f"GenAI version: {getattr(genai, '__version__', 'unknown')}")
except Exception as e:
    results.append(f"google.generativeai import: FAILED - {e}")

results.append(f"Python version: {sys.version}")
results.append("--- Diagnostic End ---")

with open("diag_results_fix.txt", "w") as f:
    f.write("\n".join(results))
