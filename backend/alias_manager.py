from typing import Optional, List
from datetime import datetime, timezone
from pydantic import BaseModel
from database import users_collection, user_aliases_collection
from bson import ObjectId

# Models
class AliasCreate(BaseModel):
    alias_name: str
    alias_username: str
    alias_photo: Optional[str] = None
    alias_type: str = "custom"  # "professional" | "anonymous" | "custom"
    bio: Optional[str] = None

class AliasUpdate(BaseModel):
    alias_name: Optional[str] = None
    alias_username: Optional[str] = None
    alias_photo: Optional[str] = None
    bio: Optional[str] = None

# Helper Functions
def serialize_alias(alias):
    """Convert MongoDB alias document to dict with string ID"""
    if not alias:
        return None
    alias["id"] = str(alias["_id"])
    del alias["_id"]
    return alias

async def create_alias(user_id: str, alias_data: AliasCreate) -> dict:
    """
    Create a new alias for a user.
    Returns the created alias or raises an exception.
    """
    # Check if username is already taken (by any user or alias)
    existing_user = await users_collection.find_one({"username": alias_data.alias_username.lower()})
    existing_alias = await user_aliases_collection.find_one({"alias_username": alias_data.alias_username.lower()})
    
    if existing_user or existing_alias:
        raise ValueError("Username already taken")
    
    # Count existing aliases for this user
    alias_count = await user_aliases_collection.count_documents({"user_id": user_id})
    
    # Limit to 5 aliases per user
    if alias_count >= 5:
        raise ValueError("Maximum 5 aliases allowed per user")
    
    # Create alias document
    new_alias = {
        "user_id": user_id,
        "alias_name": alias_data.alias_name,
        "alias_username": alias_data.alias_username.lower(),
        "alias_photo": alias_data.alias_photo or "",
        "alias_type": alias_data.alias_type,
        "is_active": False,  # Not active by default
        "bio": alias_data.bio or "",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    result = await user_aliases_collection.insert_one(new_alias)
    new_alias["_id"] = result.inserted_id
    
    return serialize_alias(new_alias)

async def get_user_aliases(user_id: str) -> List[dict]:
    """Get all aliases for a user"""
    cursor = user_aliases_collection.find({"user_id": user_id})
    aliases = []
    async for alias in cursor:
        aliases.append(serialize_alias(alias))
    return aliases

async def get_alias_by_id(alias_id: str) -> Optional[dict]:
    """Get a specific alias by ID"""
    try:
        alias = await user_aliases_collection.find_one({"_id": ObjectId(alias_id)})
        return serialize_alias(alias)
    except:
        return None

async def update_alias(alias_id: str, user_id: str, update_data: AliasUpdate) -> dict:
    """Update an alias (only if owned by user)"""
    try:
        alias_oid = ObjectId(alias_id)
    except:
        raise ValueError("Invalid alias ID")
    
    # Verify ownership
    alias = await user_aliases_collection.find_one({"_id": alias_oid, "user_id": user_id})
    if not alias:
        raise ValueError("Alias not found or not owned by user")
    
    # Build update dict (only include non-None fields)
    update_dict = {}
    if update_data.alias_name is not None:
        update_dict["alias_name"] = update_data.alias_name
    if update_data.alias_username is not None:
        # Check if new username is available
        existing = await user_aliases_collection.find_one({
            "alias_username": update_data.alias_username.lower(),
            "_id": {"$ne": alias_oid}
        })
        if existing:
            raise ValueError("Username already taken")
        update_dict["alias_username"] = update_data.alias_username.lower()
    if update_data.alias_photo is not None:
        update_dict["alias_photo"] = update_data.alias_photo
    if update_data.bio is not None:
        update_dict["bio"] = update_data.bio
    
    if update_dict:
        await user_aliases_collection.update_one(
            {"_id": alias_oid},
            {"$set": update_dict}
        )
    
    # Return updated alias
    updated_alias = await user_aliases_collection.find_one({"_id": alias_oid})
    return serialize_alias(updated_alias)

async def delete_alias(alias_id: str, user_id: str) -> bool:
    """Delete an alias (only if owned by user)"""
    try:
        alias_oid = ObjectId(alias_id)
    except:
        raise ValueError("Invalid alias ID")
    
    # Verify ownership
    alias = await user_aliases_collection.find_one({"_id": alias_oid, "user_id": user_id})
    if not alias:
        raise ValueError("Alias not found or not owned by user")
    
    # If this was the active alias, deactivate it in user profile
    if alias.get("is_active"):
        await users_collection.update_one(
            {"_id": user_id},
            {"$unset": {"active_alias_id": ""}}
        )
    
    # Delete the alias
    result = await user_aliases_collection.delete_one({"_id": alias_oid})
    return result.deleted_count > 0

async def activate_alias(alias_id: str, user_id: str) -> dict:
    """
    Activate an alias for a user.
    Deactivates all other aliases and sets this one as active.
    """
    try:
        alias_oid = ObjectId(alias_id)
    except:
        raise ValueError("Invalid alias ID")
    
    # Verify ownership
    alias = await user_aliases_collection.find_one({"_id": alias_oid, "user_id": user_id})
    if not alias:
        raise ValueError("Alias not found or not owned by user")
    
    # Deactivate all other aliases for this user
    await user_aliases_collection.update_many(
        {"user_id": user_id},
        {"$set": {"is_active": False}}
    )
    
    # Activate this alias
    await user_aliases_collection.update_one(
        {"_id": alias_oid},
        {"$set": {"is_active": True}}
    )
    
    # Update user's active_alias_id
    await users_collection.update_one(
        {"_id": user_id},
        {"$set": {"active_alias_id": alias_id}}
    )
    
    # Return updated alias
    updated_alias = await user_aliases_collection.find_one({"_id": alias_oid})
    return serialize_alias(updated_alias)

async def deactivate_all_aliases(user_id: str) -> bool:
    """Deactivate all aliases and return to main profile"""
    # Deactivate all aliases
    await user_aliases_collection.update_many(
        {"user_id": user_id},
        {"$set": {"is_active": False}}
    )
    
    # Remove active_alias_id from user
    await users_collection.update_one(
        {"_id": user_id},
        {"$unset": {"active_alias_id": ""}}
    )
    
    return True

async def get_active_alias(user_id: str) -> Optional[dict]:
    """Get the currently active alias for a user (if any)"""
    alias = await user_aliases_collection.find_one({
        "user_id": user_id,
        "is_active": True
    })
    return serialize_alias(alias)

async def get_display_info(user_id: str, alias_id: Optional[str] = None) -> dict:
    """
    Get the display information for a user or their alias.
    If alias_id is provided, return alias info. Otherwise, check for active alias.
    If no alias, return main user info.
    """
    if alias_id:
        alias = await get_alias_by_id(alias_id)
        if alias and alias["user_id"] == user_id:
            return {
                "display_name": alias["alias_name"],
                "username": alias["alias_username"],
                "photo_url": alias["alias_photo"],
                "bio": alias.get("bio", ""),
                "is_alias": True,
                "alias_id": alias["id"]
            }
    
    # Check for active alias
    active_alias = await get_active_alias(user_id)
    if active_alias:
        return {
            "display_name": active_alias["alias_name"],
            "username": active_alias["alias_username"],
            "photo_url": active_alias["alias_photo"],
            "bio": active_alias.get("bio", ""),
            "is_alias": True,
            "alias_id": active_alias["id"]
        }
    
    # Return main user info
    user = await users_collection.find_one({"_id": user_id})
    if user:
        return {
            "display_name": user.get("display_name", ""),
            "username": user.get("username", ""),
            "photo_url": user.get("photoURL", ""),
            "bio": user.get("bio", ""),
            "is_alias": False,
            "alias_id": None
        }
    
    return None
