from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
import uuid
from database import communities_collection, hubs_collection, reports_collection

router = APIRouter(prefix="/api/v1/admin", tags=["Admin Modules"])

# ==========================================
# MODULE 1: COMMUNITY MANAGEMENT
# ==========================================
class AdminCommunity(BaseModel):
    id: Optional[str] = None
    name: str
    category: str
    privacy: str
    description: str
    rules: str
    moderation_level: str
    active_status: bool
    created_at: Optional[datetime] = None

@router.post("/communities", response_model=AdminCommunity)
async def create_community(data: AdminCommunity):
    doc = data.dict()
    doc["id"] = str(uuid.uuid4())[:8]
    doc["created_at"] = datetime.utcnow()
    await communities_collection.insert_one(doc)
    return doc

@router.get("/communities", response_model=List[AdminCommunity])
async def list_communities():
    docs = []
    async for doc in communities_collection.find():
        doc["_id"] = str(doc["_id"])
        if "id" not in doc:
            doc["id"] = doc["_id"][-8:] # Fallback
        
        # Ensure new fields exist for existing data
        doc["category"] = doc.get("category", "General")
        doc["privacy"] = doc.get("privacy", "Public")
        doc["description"] = doc.get("description", "")
        doc["rules"] = doc.get("rules", "")
        doc["moderation_level"] = doc.get("moderation_level", "Medium")
        doc["active_status"] = doc.get("active_status", True)
        docs.append(doc)
    return docs

@router.get("/communities/search/{item_id}", response_model=AdminCommunity)
async def search_community(item_id: str):
    doc = await communities_collection.find_one({"id": item_id})
    if not doc:
        # Try fallback to _id if it's a mongo ID, or just return 404
        raise HTTPException(status_code=404, detail="Community not found")
    
    doc["_id"] = str(doc["_id"])
    doc["moderation_level"] = doc.get("moderation_level", "Medium")
    doc["active_status"] = doc.get("active_status", True)
    return doc

@router.put("/communities/{item_id}", response_model=AdminCommunity)
async def update_community(item_id: str, data: AdminCommunity):
    update_data = data.dict(exclude_unset=True)
    if "id" in update_data: del update_data["id"]
    
    res = await communities_collection.update_one({"id": item_id}, {"$set": update_data})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Community not found")
    return await search_community(item_id)

@router.delete("/communities/{item_id}")
async def delete_community(item_id: str):
    res = await communities_collection.delete_one({"id": item_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Community not found")
    return {"status": "deleted"}

# ==========================================
# MODULE 2: INDUSTRY HUB MANAGER
# ==========================================
class AdminHub(BaseModel):
    id: Optional[str] = None
    name: str               # 1
    sector: str             # 2
    lead_admin: str         # 3
    theme_color: str        # 4
    ui_status: str          # 5
    resource_url: str       # 6
    is_featured: bool       # 7
    created_at: Optional[datetime] = None

@router.post("/hubs", response_model=AdminHub)
async def create_hub(data: AdminHub):
    doc = data.dict()
    doc["id"] = str(uuid.uuid4())[:12]
    doc["created_at"] = datetime.utcnow()
    await hubs_collection.insert_one(doc)
    return doc

@router.get("/hubs", response_model=List[AdminHub])
async def list_hubs():
    docs = []
    async for doc in hubs_collection.find():
        doc["_id"] = str(doc["_id"])
        docs.append(doc)
    return docs

@router.get("/hubs/search/{item_id}", response_model=AdminHub)
async def search_hub(item_id: str):
    doc = await hubs_collection.find_one({"id": item_id})
    if not doc: raise HTTPException(status_code=404, detail="Hub not found")
    doc["_id"] = str(doc["_id"])
    return doc

@router.put("/hubs/{item_id}", response_model=AdminHub)
async def update_hub(item_id: str, data: AdminHub):
    update_data = data.dict(exclude_unset=True)
    if "id" in update_data: del update_data["id"]
    res = await hubs_collection.update_one({"id": item_id}, {"$set": update_data})
    if res.matched_count == 0: raise HTTPException(status_code=404)
    return await search_hub(item_id)

@router.delete("/hubs/{item_id}")
async def delete_hub(item_id: str):
    res = await hubs_collection.delete_one({"id": item_id})
    if res.deleted_count == 0: raise HTTPException(status_code=404)
    return {"status": "deleted"}

# ==========================================
# MODULE 3: REPORTED CONTENT CASE MANAGER
# ==========================================
class AdminReportCase(BaseModel):
    id: Optional[str] = None
    title: str              # 1
    type: str               # 2
    severity: int           # 3
    assigned_to: str        # 4
    notes: str              # 5
    action: str             # 6
    is_urgent: bool         # 7
    created_at: Optional[datetime] = None

@router.post("/reports", response_model=AdminReportCase)
async def create_report_case(data: AdminReportCase):
    doc = data.dict()
    doc["id"] = str(uuid.uuid4())[:8]
    doc["created_at"] = datetime.utcnow()
    await reports_collection.insert_one(doc)
    return doc

@router.get("/reports", response_model=List[AdminReportCase])
async def list_report_cases():
    docs = []
    async for doc in reports_collection.find():
        doc["_id"] = str(doc["_id"])
        
        # Mapping from possible old reports to new admin reports format
        if "id" not in doc: doc["id"] = doc["_id"][-8:]
        doc["title"] = doc.get("title", f"Report for {doc.get('target_type', 'item')}")
        doc["type"] = doc.get("type", doc.get("reason_type", "General"))
        doc["severity"] = doc.get("severity", 3)
        doc["assigned_to"] = doc.get("assigned_to", "Unassigned")
        doc["notes"] = doc.get("notes", doc.get("details", ""))
        doc["action"] = doc.get("action", "Pending Review")
        doc["is_urgent"] = doc.get("is_urgent", False)
        
        docs.append(doc)
    return docs

@router.get("/reports/search/{item_id}", response_model=AdminReportCase)
async def search_report_case(item_id: str):
    doc = await reports_collection.find_one({"id": item_id})
    if not doc: raise HTTPException(status_code=404, detail="Report Case not found")
    doc["_id"] = str(doc["_id"])
    # Map fields dynamically if it's an old report structure
    doc["title"] = doc.get("title", f"Report for {doc.get('target_type', 'item')}")
    doc["type"] = doc.get("type", doc.get("reason_type", "General"))
    doc["severity"] = doc.get("severity", 3)
    doc["assigned_to"] = doc.get("assigned_to", "Unassigned")
    doc["notes"] = doc.get("notes", doc.get("details", ""))
    doc["action"] = doc.get("action", "Pending Review")
    doc["is_urgent"] = doc.get("is_urgent", False)
    return doc

@router.put("/reports/{item_id}", response_model=AdminReportCase)
async def update_report_case(item_id: str, data: AdminReportCase):
    update_data = data.dict(exclude_unset=True)
    if "id" in update_data: del update_data["id"]
    res = await reports_collection.update_one({"id": item_id}, {"$set": update_data})
    if res.matched_count == 0: raise HTTPException(status_code=404)
    return await search_report_case(item_id)

@router.delete("/reports/{item_id}")
async def delete_report_case(item_id: str):
    res = await reports_collection.delete_one({"id": item_id})
    if res.deleted_count == 0: raise HTTPException(status_code=404)
    return {"status": "deleted"}
