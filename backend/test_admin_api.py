import sys
import os

# Add current directory to path
sys.path.append(os.getcwd())

try:
    print("Testing admin_api import...")
    from admin_api import router
    print("Import successful!")
    
    # Test simple model instantiation
    from admin_api import AdminCommunity
    from datetime import datetime
    c = AdminCommunity(
        name="test",
        category="test",
        privacy="test",
        description="test",
        rules="test",
        moderation_level="test",
        active_status=True,
        created_at=datetime.now()
    )
    print("Model instantiation successful!")
    
except Exception as e:
    print(f"ERROR: {type(e).__name__}: {e}")
    import traceback
    traceback.print_exc()
