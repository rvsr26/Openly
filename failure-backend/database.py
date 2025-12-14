import firebase_admin
from firebase_admin import credentials, firestore

# 1. Check if app is already initialized to avoid errors on reload
if not firebase_admin._apps:
    # Load the key you downloaded
    cred = credentials.Certificate("serviceAccountKey.json")
    firebase_admin.initialize_app(cred)

# 2. Get the database client
db = firestore.client()