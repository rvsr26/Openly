from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

MONGO_URL = os.getenv("MONGODB_URL")
client = AsyncIOMotorClient(MONGO_URL)
db = client.failure_db

# Collections
posts_collection = db.get_collection("posts")
users_collection = db.get_collection("users")
comments_collection = db.get_collection("comments") 
reactions_collection = db.get_collection("reactions")
connections_collection = db.get_collection("connections")
notifications_collection = db.get_collection("notifications")
bookmarks_collection = db.get_collection("bookmarks")
reports_collection = db.get_collection("reports")