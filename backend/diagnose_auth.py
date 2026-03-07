import sys
import os

# Add current directory to path
sys.path.append(os.getcwd())

try:
    print("Attempting to import auth...")
    import auth
    print("SUCCESS: auth imported successfully")
    print("Available attributes:", [a for a in dir(auth) if not a.startswith("__")][:10])
except Exception as e:
    print(f"FAILED: auth import failed with error: {e}")
    import traceback
    traceback.print_exc()
