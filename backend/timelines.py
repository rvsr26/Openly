from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from time_utils import get_now_iso
from database import timelines_collection, posts_collection
from bson import ObjectId
from auth import get_current_user

router = APIRouter(prefix="/api/v1/timelines", tags=["Timelines"])

# --- Models ---
class TimelineCreate(BaseModel):
    title: str
    description: Optional[str] = None
    status: str = "active"  # active, completed

class TimelineUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None

class TimelineResponse(BaseModel):
    id: str
    user_id: str
    title: str
    description: Optional[str] = None
    status: str
    created_at: str

# --- Helpers ---
def serialize_timeline(doc):
    if not doc: return None
    doc["id"] = str(doc["_id"])
    del doc["_id"]
    return doc

# --- Endpoints ---

@router.post("/", response_model=TimelineResponse)
async def create_timeline(timeline: TimelineCreate, user = Depends(get_current_user)):
    """Create a new 'Journey' timeline"""
    new_timeline = {
        "user_id": user["_id"],
        "title": timeline.title,
        "description": timeline.description,
        "status": timeline.status,
        "created_at": get_now_iso()
    }
    
    result = await timelines_collection.insert_one(new_timeline)
    return serialize_timeline(await timelines_collection.find_one({"_id": result.inserted_id}))

@router.get("/user/{user_id}", response_model=List[TimelineResponse])
async def get_user_timelines(user_id: str):
    """Get all timelines for a specific user"""
    cursor = timelines_collection.find({"user_id": user_id}).sort("created_at", -1)
    timelines = await cursor.to_list(length=100)
    return [serialize_timeline(t) for t in timelines]

@router.get("/{timeline_id}", response_model=TimelineResponse)
async def get_timeline(timeline_id: str):
    """Get a specific timeline by ID"""
    if not ObjectId.is_valid(timeline_id):
        raise HTTPException(status_code=400, detail="Invalid ID format")
        
    timeline = await timelines_collection.find_one({"_id": ObjectId(timeline_id)})
    if not timeline:
        raise HTTPException(status_code=404, detail="Timeline not found")
        
    return serialize_timeline(timeline)

@router.put("/{timeline_id}", response_model=TimelineResponse)
async def update_timeline(timeline_id: str, update_data: TimelineUpdate, user = Depends(get_current_user)):
    """Update a timeline (title, description, status)"""
    if not ObjectId.is_valid(timeline_id):
        raise HTTPException(status_code=400, detail="Invalid ID format")

    # Verify ownership
    timeline = await timelines_collection.find_one({"_id": ObjectId(timeline_id)})
    if not timeline:
        raise HTTPException(status_code=404, detail="Timeline not found")
    
    if timeline["user_id"] != user["_id"]:
        raise HTTPException(status_code=403, detail="Not authorized to edit this timeline")

    # Prepare update
    update_fields = {k: v for k, v in update_data.dict().items() if v is not None}
    if not update_fields:
        return serialize_timeline(timeline)

    await timelines_collection.update_one(
        {"_id": ObjectId(timeline_id)},
        {"$set": update_fields}
    )
    
    return serialize_timeline(await timelines_collection.find_one({"_id": ObjectId(timeline_id)}))

@router.get("/{timeline_id}/posts")
async def get_timeline_posts(timeline_id: str):
    """Get all posts associated with this timeline"""
    # Verify timeline exists
    if not ObjectId.is_valid(timeline_id):
        raise HTTPException(status_code=400, detail="Invalid ID format")

    # Find posts with this timeline_id
    cursor = posts_collection.find({"timeline_id": timeline_id}).sort("created_at", 1) # Oldest first for journey
    posts = await cursor.to_list(length=100)
    
    # helper from main.py or redefine here?
    # Ideally should share a serializer, but for now we'll do a simple one or just return list
    # Let's map _id to id
    results = []
    for p in posts:
        p["id"] = str(p["_id"])
        del p["_id"]
        results.append(p)
        
    return results
