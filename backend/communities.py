"""
communities.py - Communities / Groups feature for Openly.

Collections:
  communities        - Community documents
  community_members  - Membership documents
"""

from datetime import datetime, timezone
from typing import Optional, List
from pydantic import BaseModel
from bson import ObjectId
from database import communities_collection, community_members_collection, posts_collection
import re


# ─────────────────────────────────────────────
#  PYDANTIC MODELS
# ─────────────────────────────────────────────

class CommunityCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    category: Optional[str] = "General"
    privacy: str = "public"          # "public" | "private"
    rules: Optional[str] = ""
    banner_url: Optional[str] = None
    icon_url: Optional[str] = None

class CommunityUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    rules: Optional[str] = None
    banner_url: Optional[str] = None
    icon_url: Optional[str] = None


# ─────────────────────────────────────────────
#  HELPERS
# ─────────────────────────────────────────────

def slugify(name: str) -> str:
    """Convert 'Tech Founders' → 'tech-founders'."""
    slug = name.lower().strip()
    slug = re.sub(r"[^\w\s-]", "", slug)
    slug = re.sub(r"[\s_]+", "-", slug)
    slug = re.sub(r"-+", "-", slug)
    return slug[:60]


def serialize_community(doc: dict) -> dict:
    if not doc:
        return {}
    doc["id"] = str(doc["_id"])
    del doc["_id"]
    return doc


def serialize_member(doc: dict) -> dict:
    if not doc:
        return {}
    doc["id"] = str(doc["_id"])
    del doc["_id"]
    return doc


async def get_member_role(user_id: str, community_id: str) -> Optional[str]:
    """Return the role of user in the community, or None if not a member."""
    m = await community_members_collection.find_one(
        {"user_id": user_id, "community_id": community_id, "status": "active"}
    )
    return m["role"] if m else None


async def assert_mod(user_id: str, community_id: str):
    """Raise ValueError if user is not mod/owner."""
    role = await get_member_role(user_id, community_id)
    if role not in ("mod", "owner"):
        raise ValueError("Only moderators or the owner can perform this action.")


async def assert_owner(user_id: str, community_id: str):
    """Raise ValueError if user is not owner."""
    role = await get_member_role(user_id, community_id)
    if role != "owner":
        raise ValueError("Only the owner can perform this action.")


# ─────────────────────────────────────────────
#  COMMUNITY CRUD
# ─────────────────────────────────────────────

async def create_community(owner_id: str, data: CommunityCreate) -> dict:
    now = datetime.now(timezone.utc).isoformat()
    slug = slugify(data.name)

    # Ensure slug uniqueness
    existing = await communities_collection.find_one({"slug": slug})
    if existing:
        slug = f"{slug}-{str(ObjectId())[:4]}"

    community_doc = {
        "name": data.name,
        "slug": slug,
        "description": data.description,
        "category": data.category,
        "privacy": data.privacy,
        "rules": data.rules,
        "banner_url": data.banner_url,
        "icon_url": data.icon_url,
        "owner_id": owner_id,
        "member_count": 1,
        "post_count": 0,
        "is_deleted": False,
        "created_at": now,
        "updated_at": now,
    }

    result = await communities_collection.insert_one(community_doc)
    community_id = str(result.inserted_id)

    # Add owner as first member
    await community_members_collection.insert_one({
        "community_id": community_id,
        "user_id": owner_id,
        "role": "owner",
        "status": "active",
        "joined_at": now,
    })

    community_doc["id"] = community_id
    community_doc.pop("_id", None)
    return {**community_doc, "id": community_id}


async def get_community(slug_or_id: str) -> Optional[dict]:
    """Fetch community by slug or ObjectId."""
    doc = await communities_collection.find_one({"slug": slug_or_id, "is_deleted": False})
    if not doc:
        try:
            doc = await communities_collection.find_one(
                {"_id": ObjectId(slug_or_id), "is_deleted": False}
            )
        except Exception:
            pass
    return serialize_community(doc) if doc else None


async def list_communities(
    search: str = "",
    category: str = "",
    sort: str = "members",  # "members" | "new" | "posts"
    skip: int = 0,
    limit: int = 20,
) -> List[dict]:
    query: dict = {"is_deleted": False}
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}},
        ]
    if category and category != "All":
        query["category"] = category

    sort_field = (
        ("member_count", -1) if sort == "members"
        else ("post_count", -1) if sort == "posts"
        else ("created_at", -1)
    )

    cursor = communities_collection.find(query).sort(*sort_field).skip(skip).limit(limit)
    docs = []
    async for doc in cursor:
        docs.append(serialize_community(doc))
    return docs


async def update_community(user_id: str, community_id: str, data: CommunityUpdate) -> dict:
    await assert_mod(user_id, community_id)

    updates = {k: v for k, v in data.dict().items() if v is not None}
    if not updates:
        raise ValueError("No fields to update.")
    updates["updated_at"] = datetime.now(timezone.utc).isoformat()

    await communities_collection.update_one({"_id": ObjectId(community_id)}, {"$set": updates})
    return await get_community(community_id)


async def delete_community(user_id: str, community_id: str) -> bool:
    await assert_owner(user_id, community_id)
    result = await communities_collection.update_one(
        {"_id": ObjectId(community_id)},
        {"$set": {"is_deleted": True, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    return result.modified_count > 0


# ─────────────────────────────────────────────
#  MEMBERSHIP
# ─────────────────────────────────────────────

async def join_community(user_id: str, community_id: str) -> dict:
    """
    Public: immediately active.
    Private: status = "pending".
    """
    community = await communities_collection.find_one({"_id": ObjectId(community_id)})
    if not community:
        raise ValueError("Community not found.")
    if community.get("is_deleted"):
        raise ValueError("Community has been deleted.")

    existing = await community_members_collection.find_one(
        {"user_id": user_id, "community_id": community_id}
    )
    if existing:
        if existing["status"] == "active":
            raise ValueError("Already a member.")
        if existing["status"] == "pending":
            raise ValueError("Join request already pending.")

    status = "active" if community["privacy"] == "public" else "pending"
    now = datetime.now(timezone.utc).isoformat()

    await community_members_collection.insert_one({
        "community_id": community_id,
        "user_id": user_id,
        "role": "member",
        "status": status,
        "joined_at": now,
    })

    if status == "active":
        await communities_collection.update_one(
            {"_id": ObjectId(community_id)},
            {"$inc": {"member_count": 1}}
        )

    return {"status": status, "message": "Joined!" if status == "active" else "Join request sent."}


async def leave_community(user_id: str, community_id: str) -> bool:
    m = await community_members_collection.find_one(
        {"user_id": user_id, "community_id": community_id}
    )
    if not m:
        raise ValueError("Not a member.")
    if m["role"] == "owner":
        raise ValueError("Owner cannot leave. Transfer ownership first or delete the community.")

    result = await community_members_collection.delete_one(
        {"user_id": user_id, "community_id": community_id}
    )
    if result.deleted_count > 0 and m["status"] == "active":
        await communities_collection.update_one(
            {"_id": ObjectId(community_id)},
            {"$inc": {"member_count": -1}}
        )
    return True


async def get_members(community_id: str, status: str = "active", skip: int = 0, limit: int = 50) -> List[dict]:
    cursor = community_members_collection.find(
        {"community_id": community_id, "status": status}
    ).skip(skip).limit(limit)
    members = []
    async for m in cursor:
        members.append(serialize_member(m))
    return members


async def approve_member(mod_id: str, community_id: str, target_user_id: str) -> bool:
    await assert_mod(mod_id, community_id)
    result = await community_members_collection.update_one(
        {"user_id": target_user_id, "community_id": community_id, "status": "pending"},
        {"$set": {"status": "active"}}
    )
    if result.modified_count > 0:
        await communities_collection.update_one(
            {"_id": ObjectId(community_id)},
            {"$inc": {"member_count": 1}}
        )
        return True
    raise ValueError("No pending request found for this user.")


async def kick_member(mod_id: str, community_id: str, target_user_id: str) -> bool:
    await assert_mod(mod_id, community_id)

    target = await community_members_collection.find_one(
        {"user_id": target_user_id, "community_id": community_id}
    )
    if not target:
        raise ValueError("User is not a member.")
    if target["role"] == "owner":
        raise ValueError("Cannot kick the owner.")

    result = await community_members_collection.delete_one(
        {"user_id": target_user_id, "community_id": community_id}
    )
    if result.deleted_count > 0:
        await communities_collection.update_one(
            {"_id": ObjectId(community_id)},
            {"$inc": {"member_count": -1}}
        )
    return True


async def promote_member(owner_id: str, community_id: str, target_user_id: str) -> bool:
    await assert_owner(owner_id, community_id)
    result = await community_members_collection.update_one(
        {"user_id": target_user_id, "community_id": community_id, "status": "active"},
        {"$set": {"role": "mod"}}
    )
    if result.modified_count == 0:
        raise ValueError("User not found or not an active member.")
    return True


async def demote_member(owner_id: str, community_id: str, target_user_id: str) -> bool:
    await assert_owner(owner_id, community_id)
    result = await community_members_collection.update_one(
        {"user_id": target_user_id, "community_id": community_id, "status": "active"},
        {"$set": {"role": "member"}}
    )
    if result.modified_count == 0:
        raise ValueError("User not found or not an active member.")
    return True


# ─────────────────────────────────────────────
#  USER COMMUNITIES
# ─────────────────────────────────────────────

async def get_user_communities(user_id: str) -> List[dict]:
    """Return list of active communities the user belongs to."""
    cursor = community_members_collection.find(
        {"user_id": user_id, "status": "active"}
    ).sort("joined_at", -1).limit(20)

    community_ids = []
    async for m in cursor:
        try:
            community_ids.append(ObjectId(m["community_id"]))
        except Exception:
            pass

    if not community_ids:
        return []

    communities = []
    cursor2 = communities_collection.find({"_id": {"$in": community_ids}, "is_deleted": False})
    async for doc in cursor2:
        communities.append(serialize_community(doc))
    return communities


# ─────────────────────────────────────────────
#  COMMUNITY POSTS
# ─────────────────────────────────────────────

async def get_community_posts(
    community_id: str,
    sort: str = "new",
    skip: int = 0,
    limit: int = 20,
) -> List[dict]:
    """Return posts for a community."""
    query = {"community_id": community_id, "is_rejected": {"$ne": True}}

    sort_key = (
        [("reaction_count", -1), ("created_at", -1)] if sort == "hot"
        else [("reaction_count", -1)] if sort == "top"
        else [("created_at", -1)]
    )

    cursor = posts_collection.find(query).sort(sort_key).skip(skip).limit(limit)
    posts = []
    async for doc in cursor:
        doc["id"] = str(doc["_id"])
        del doc["_id"]
        if "user_name" in doc and "author" not in doc:
            doc["author"] = doc["user_name"]
        posts.append(doc)
    return posts
