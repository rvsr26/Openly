import os
import sys

print("Python Version:", sys.version)
print("Current Directory:", os.getcwd())

try:
    print("Attempting to import FastAPI...")
    from fastapi import FastAPI
    print("FastAPI imported.")
    
    print("Attempting to import main.py app...")
    from main import app
    print("App imported successfully.")
    
    print("Checking database connection...")
    import asyncio
    from database import db
    
    async def check_db():
        try:
            await db.command("ping")
            print("Database connection successful.")
        except Exception as e:
            print(f"Database connection failed: {e}")
            
    asyncio.run(check_db())
    
except Exception as e:
    import traceback
    print("An error occurred during startup:")
    traceback.print_exc()
