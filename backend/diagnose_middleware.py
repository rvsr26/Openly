import sys
import os

# Add current directory to path
sys.path.append(os.getcwd())

try:
    print("Attempting to import middleware...")
    import middleware
    print("SUCCESS: middleware imported successfully")
except Exception as e:
    print(f"FAILED: middleware import failed with error: {e}")
    import traceback
    traceback.print_exc()
