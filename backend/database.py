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
follows_collection = db.get_collection("follows")
drafts_collection = db.get_collection("drafts")
downvotes_collection = db.get_collection("downvotes")
views_collection = db.get_collection("views")
messages_collection = db.get_collection("messages")
conversations_collection = db.get_collection("conversations")

# Authentication collections
verification_tokens_collection = db.get_collection("verification_tokens")
password_reset_tokens_collection = db.get_collection("password_reset_tokens")
