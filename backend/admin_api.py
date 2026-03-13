from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from time_utils import get_now
import uuid
from database import communities_collection, hubs_collection, reports_collection, posts_collection, users_collection
from bson import ObjectId
try:
    from cache_utils import invalidate_category_cache
except ImportError:
    invalidate_category_cache = None

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
    doc["created_at"] = get_now()
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
        # Fallback to last 8 chars of ObjectId if explicit ID fails
        try:
            from bson import ObjectId
            doc = await communities_collection.find_one({"_id": ObjectId(item_id)})
        except:
            # If not a valid ObjectId, try search by partial string id
            doc = await communities_collection.find_one({"_id": {"$regex": f"{item_id}$"}})
            
    if not doc:
        raise HTTPException(status_code=404, detail=f"Community {item_id} not found")
    
    doc["_id"] = str(doc["_id"])
    doc["category"] = doc.get("category", "General")
    doc["privacy"] = doc.get("privacy", "Public")
    doc["description"] = doc.get("description", "")
    doc["rules"] = doc.get("rules", "")
    doc["moderation_level"] = doc.get("moderation_level", "Medium")
    doc["active_status"] = doc.get("active_status", True)
    return doc

@router.put("/communities/{item_id}", response_model=AdminCommunity)
async def update_community(item_id: str, data: AdminCommunity):
    update_data = data.dict(exclude_unset=True)
    if "id" in update_data: del update_data["id"]
    
    # Try by explicit id first
    res = await communities_collection.update_one({"id": item_id}, {"$set": update_data})
    
    # Fallback to _id if no match
    if res.matched_count == 0:
        try:
            res = await communities_collection.update_one({"_id": ObjectId(item_id)}, {"$set": update_data})
        except:
            # Last fallback regex
            res = await communities_collection.update_one({"_id": {"$regex": f"{item_id}$"}}, {"$set": update_data})

    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Community not found")
    return await search_community(item_id)

@router.delete("/communities/{item_id}")
async def delete_community(item_id: str):
    # Try by explicit id first
    res = await communities_collection.delete_one({"id": item_id})
    
    # Fallback to _id if no match
    if res.deleted_count == 0:
        try:
            res = await communities_collection.delete_one({"_id": ObjectId(item_id)})
        except:
            # Last fallback regex
            res = await communities_collection.delete_one({"_id": {"$regex": f"{item_id}$"}})
            
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
    doc["created_at"] = get_now()
    await hubs_collection.insert_one(doc)
    return doc

@router.get("/hubs", response_model=List[AdminHub])
async def list_hubs():
    docs = []
    async for doc in hubs_collection.find():
        doc["_id"] = str(doc["_id"])
        if "id" not in doc: doc["id"] = doc["_id"][-12:]
        
        # Robust fallbacks for Hub fields
        doc["sector"] = doc.get("sector", "Technology")
        doc["lead_admin"] = doc.get("lead_admin", "System")
        doc["theme_color"] = doc.get("theme_color", "#4f46e5")
        doc["ui_status"] = doc.get("ui_status", "Active")
        doc["resource_url"] = doc.get("resource_url", "")
        doc["is_featured"] = doc.get("is_featured", False)
        docs.append(doc)
    return docs

@router.get("/hubs/search/{item_id}", response_model=AdminHub)
async def search_hub(item_id: str):
    doc = await hubs_collection.find_one({"id": item_id})
    if not doc:
        try:
            from bson import ObjectId
            doc = await hubs_collection.find_one({"_id": ObjectId(item_id)})
        except:
            doc = await hubs_collection.find_one({"_id": {"$regex": f"{item_id}$"}})
            
    if not doc: raise HTTPException(status_code=404, detail="Hub not found")
    doc["_id"] = str(doc["_id"])
    if "id" not in doc: doc["id"] = doc["_id"][-12:]
    
    doc["sector"] = doc.get("sector", "Technology")
    doc["lead_admin"] = doc.get("lead_admin", "System")
    doc["theme_color"] = doc.get("theme_color", "#4f46e5")
    doc["ui_status"] = doc.get("ui_status", "Active")
    doc["resource_url"] = doc.get("resource_url", "")
    doc["is_featured"] = doc.get("is_featured", False)
    return doc

@router.put("/hubs/{item_id}", response_model=AdminHub)
async def update_hub(item_id: str, data: AdminHub):
    update_data = data.dict(exclude_unset=True)
    if "id" in update_data: del update_data["id"]
    
    res = await hubs_collection.update_one({"id": item_id}, {"$set": update_data})
    
    if res.matched_count == 0:
        try:
            res = await hubs_collection.update_one({"_id": ObjectId(item_id)}, {"$set": update_data})
        except:
            res = await hubs_collection.update_one({"_id": {"$regex": f"{item_id}$"}}, {"$set": update_data})
            
    if res.matched_count == 0: raise HTTPException(status_code=404)
    return await search_hub(item_id)

@router.delete("/hubs/{item_id}")
async def delete_hub(item_id: str):
    res = await hubs_collection.delete_one({"id": item_id})
    if res.deleted_count == 0:
        try:
            res = await hubs_collection.delete_one({"_id": ObjectId(item_id)})
        except:
            res = await hubs_collection.delete_one({"_id": {"$regex": f"{item_id}$"}})
            
    if res.deleted_count == 0: raise HTTPException(status_code=404)
    return {"status": "deleted"}

# ==========================================
# MODULE 3: REPORTED CONTENT CASE MANAGER
# ==========================================
class AdminReportCase(BaseModel):
    id: Optional[str] = None
    title: str              # 1
    type: str               # 2
    severity: int = 3       # 3
    assigned_to: str = "Unassigned" # 4
    notes: str = ""         # 5
    action: str             # 6
    is_urgent: bool         # 7
    target_id: Optional[str] = None
    target_type: Optional[str] = "post"
    created_at: Optional[datetime] = None

@router.post("/reports", response_model=AdminReportCase)
async def create_report_case(data: AdminReportCase):
    doc = data.dict()
    doc["id"] = str(uuid.uuid4())[:8]
    doc["created_at"] = get_now()
    
    # Side effect: Flag the target if it's a post
    if data.target_id and data.target_type == "post":
        try:
            from database import posts_collection
            post_query = {
                "$or": [
                    {"id": data.target_id},
                    {"$expr": {
                        "$gt": [
                            {"$indexOfCP": [{"$toString": "$_id"}, data.target_id]},
                            -1
                        ]
                    }}
                ]
            }
            await posts_collection.update_one(
                post_query, 
                {"$set": {"is_flagged": True}, "$inc": {"report_count": 1}}
            )
        except Exception as e:
            print(f"Error flagging post in manual report: {e}")

    await reports_collection.insert_one(doc)
    return doc

@router.get("/reports", response_model=List[AdminReportCase])
async def list_report_cases():
    docs = []
    async for doc in reports_collection.find():
        doc["_id"] = str(doc["_id"])
        
        # Mapping from possible old reports to new admin reports format
        if "id" not in doc: doc["id"] = doc["_id"][-8:]
        doc["title"] = doc.get("title") or f"Report for {doc.get('target_type', 'item')}"
        doc["type"] = doc.get("type") or doc.get("reason_type") or "General"
        doc["severity"] = doc.get("severity") or 3
        doc["assigned_to"] = doc.get("assigned_to") or "Unassigned"
        doc["notes"] = doc.get("notes") or doc.get("details") or ""
        doc["action"] = doc.get("action") or "Pending Review"
        doc["is_urgent"] = bool(doc.get("is_urgent", False))
        
        docs.append(doc)
    return docs

@router.get("/reports/{item_id}", response_model=AdminReportCase)
@router.get("/reports/search/{item_id}", response_model=AdminReportCase)
async def search_report_case(item_id: str):
    doc = await reports_collection.find_one({"id": item_id})
    if not doc:
        try:
            from bson import ObjectId
            doc = await reports_collection.find_one({"_id": ObjectId(item_id)})
        except:
            # Fallback for legacy reports using last 8 chars of ObjectId
            doc = await reports_collection.find_one({
                "$expr": {
                    "$gt": [
                        {"$indexOfCP": [{"$toString": "$_id"}, item_id]},
                        -1
                    ]
                }
            })
            
    if not doc: raise HTTPException(status_code=404, detail="Report Case not found")
    doc["_id"] = str(doc["_id"])
    if "id" not in doc: doc["id"] = doc["_id"][-8:]
    
    # Map fields dynamically if it's an old report structure
    doc["title"] = doc.get("title") or f"Report for {doc.get('target_type', 'item')}"
    doc["type"] = doc.get("type") or doc.get("reason_type") or "General"
    doc["severity"] = doc.get("severity") or 3
    doc["assigned_to"] = doc.get("assigned_to") or "Unassigned"
    doc["notes"] = doc.get("notes") or doc.get("details") or ""
    doc["action"] = doc.get("action") or "Pending Review"
    doc["is_urgent"] = bool(doc.get("is_urgent", False))
    return doc

@router.put("/reports/{item_id}", response_model=AdminReportCase)
async def update_report_case(item_id: str, data: AdminReportCase):
    update_data = data.dict(exclude_unset=True)
    if "id" in update_data: del update_data["id"]

    # Do not overwrite target links with empty values if they already exist in DB
    if not update_data.get("target_id"): update_data.pop("target_id", None)
    if not update_data.get("target_type"): update_data.pop("target_type", None)
    
    res = await reports_collection.update_one({"id": item_id}, {"$set": update_data})
    
    if res.matched_count == 0:
        try:
            res = await reports_collection.update_one({"_id": ObjectId(item_id)}, {"$set": update_data})
        except:
            res = await reports_collection.update_one({
                "$expr": {
                    "$gt": [
                        {"$indexOfCP": [{"$toString": "$_id"}, item_id]},
                        -1
                    ]
                }
            }, {"$set": update_data})
            
    if res.matched_count == 0: raise HTTPException(status_code=404)
    
    # --- AUTOMATION: Side effects of report resolution ---
    # Fetch the full report document to get target_id/type
    report_doc = await search_report_case(item_id)
    target_id = report_doc.get("target_id")
    target_type = report_doc.get("target_type")
    
    print(f"[DEBUG] Moderation triggered for Case: {item_id} | Action: {data.action} | Target: {target_id} ({target_type})")
    
    if target_id and data.action in ["Content Deleted", "User Banned"]:
        if target_type == "post":
            try:
                # Robust lookup: check both id field and _id suffix
                post_query = {
                    "$or": [
                        {"id": target_id},
                        {"$expr": {
                            "$gt": [
                                {"$indexOfCP": [{"$toString": "$_id"}, target_id]},
                                -1
                            ]
                        }}
                    ]
                }
                
                post = await posts_collection.find_one(post_query)
                if post:
                    await posts_collection.update_one(
                        {"_id": post["_id"]}, 
                        {"$set": {"is_rejected": True, "is_flagged": False, "report_count": 0}}
                    )
                    # Flush ALL feed caches so post disappears from home page immediately
                    try:
                        from cache_utils import invalidate_feed_cache
                        await invalidate_feed_cache("feed:*")
                    except Exception as ce:
                        print(f"Cache flush error: {ce}")
            except Exception as e:
                print(f"Post moderation error: {e}")
        
        elif data.action in ["Cleared (No Issue)", "User Warned"]:
            # Unflag but keep the post visible
            try:
                post_query = {
                    "$or": [
                        {"id": target_id},
                        {"$expr": {
                            "$gt": [
                                {"$indexOfCP": [{"$toString": "$_id"}, target_id]},
                                -1
                            ]
                        }}
                    ]
                }
                await posts_collection.update_one(post_query, {"$set": {"is_flagged": False}})
            except:
                pass
        
        if data.action == "User Banned":
            user_to_ban = None
            if target_type == "user":
                user_to_ban = target_id
            elif target_type == "post":
                try:
                    post_query = {
                        "$or": [
                            {"id": target_id},
                            {"$expr": {
                                "$gt": [
                                    {"$indexOfCP": [{"$toString": "$_id"}, target_id]},
                                    -1
                                ]
                            }}
                        ]
                    }
                    post = await posts_collection.find_one(post_query)
                    if post:
                        user_to_ban = post.get("user_id")
                except:
                    pass
            
            if user_to_ban:
                try:
                    u_oid = ObjectId(user_to_ban) if len(user_to_ban) == 24 else None
                    u_query = {"$or": [{"uid": user_to_ban}, {"_id": u_oid}]} if u_oid else {"uid": user_to_ban}
                    await users_collection.update_one(u_query, {"$set": {"is_banned": True}})
                except Exception as e:
                    print(f"User ban error: {e}")

    return report_doc

@router.delete("/reports/{item_id}")
async def delete_report_case(item_id: str):
    res = await reports_collection.delete_one({"id": item_id})
    if res.deleted_count == 0:
        try:
            res = await reports_collection.delete_one({"_id": ObjectId(item_id)})
        except:
            res = await reports_collection.delete_one({
                "$expr": {
                    "$gt": [
                        {"$indexOfCP": [{"$toString": "$_id"}, item_id]},
                        -1
                    ]
                }
            })
            
    if res.deleted_count == 0: raise HTTPException(status_code=404)
    return {"status": "deleted"}
