from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone
import json
import httpx
from bson import ObjectId
from websocket_manager import manager
from database import (
    follows_collection, 
    conversations_collection, 
    messages_collection, 
    users_collection,
    notifications_collection,
    settings_collection
)

router = APIRouter()

# --- HELPER FUNCTIONS ---

def serialize_doc(doc):
    if not doc: return None
    doc["id"] = str(doc["_id"])
    if "_id" in doc: del doc["_id"]
    return doc

async def deliver_federated_message(receiver_community_url: str, payload: dict):
    """Asynchronously deliver a message to a remote instance."""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(f"{receiver_community_url}/api/messages/remote", json=payload)
            response.raise_for_status()
            print(f"✅ Federated message delivered to {receiver_community_url}")
    except Exception as e:
        print(f"❌ Federation delivery failed: {e}")

class ConversationRequest(BaseModel):
    user_id: str
    target_user_id: str
    target_community_url: Optional[str] = None # For federation

class MessageRequest(BaseModel):
    sender_id: str
    content: str
    type: Optional[str] = "text" # text, image, doc
    media_url: Optional[str] = None

class RemoteMessageRequest(BaseModel):
    sender_id: str
    sender_name: str
    sender_pic: Optional[str] = None
    sender_community_url: str
    receiver_id: str
    content: str
    type: str = "text"
    media_url: Optional[str] = None
    timestamp: str

class ReadRequest(BaseModel):
    user_id: str



# Create or get existing conversation
@router.post("/conversations/")
async def create_or_get_conversation(req: ConversationRequest):
    # Check if DMs are disabled globally
    settings = await settings_collection.find_one({"_id": "global_settings"})
    if settings and settings.get("disable_dms"):
        # Check if the sender is an admin (bypasses restriction)
        sender = await users_collection.find_one({"_id": req.user_id})
        if not sender or (sender.get("role") != "admin" and sender.get("username") != "admin"):
            raise HTTPException(status_code=403, detail="Direct messaging is currently disabled globally")
            
    # Sort participant IDs for consistency
    participants = sorted([req.user_id, req.target_user_id])
    
    # Check if conversation already exists
    existing = await conversations_collection.find_one({
        "participants": participants
    })
    
    if existing:
        # Return existing conversation with participant info
        conv_data = serialize_doc(existing)
        
        # Fetch participant info
        participant_info = []
        for p_id in participants:
            user = await users_collection.find_one({"_id": p_id})
            if user:
                participant_info.append({
                    "id": p_id,
                    "username": user.get("username"),
                    "display_name": user.get("display_name"),
                    "photoURL": user.get("photoURL")
                })
        
        conv_data["participant_info"] = participant_info
        # Get unread count for current user
        conv_data["unread_count"] = existing.get("unread_count", {}).get(req.user_id, 0)
        
        return conv_data
    
    # Create new conversation
    new_conversation = {
        "participants": participants,
        "participant_instances": {
            req.target_user_id: req.target_community_url
        } if req.target_community_url else {},
        "last_message": "",
        "last_message_at": datetime.now(timezone.utc).isoformat(),
        "unread_count": {req.user_id: 0, req.target_user_id: 0},
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    result = await conversations_collection.insert_one(new_conversation)
    
    # Fetch participant info
    participant_info = []
    for p_id in participants:
        user = await users_collection.find_one({"_id": p_id})
        if user:
            participant_info.append({
                "id": p_id,
                "username": user.get("username"),
                "display_name": user.get("display_name"),
                "photoURL": user.get("photoURL")
            })
    
    return {
        "id": str(result.inserted_id),
        "participants": participants,
        "participant_info": participant_info,
        "last_message": "",
        "last_message_at": new_conversation["last_message_at"],
        "unread_count": 0,
        "created_at": new_conversation["created_at"]
    }

# Get all conversations for a user
@router.get("/conversations/")
async def get_conversations(user_id: str):
    # Find all conversations where user is a participant
    cursor = conversations_collection.find({
        "participants": user_id
    }).sort("last_message_at", -1)
    
    conversations = []
    async for conv in cursor:
        conv_data = serialize_doc(conv)
        
        # Get the other participant's info
        other_user_id = [p for p in conv["participants"] if p != user_id][0]
        other_user = await users_collection.find_one({"_id": other_user_id})
        
        if other_user:
            participant_info = [{
                "id": other_user_id,
                "username": other_user.get("username"),
                "display_name": other_user.get("display_name"),
                "photoURL": other_user.get("photoURL")
            }]
            
            conv_data["participant_info"] = participant_info
            conv_data["unread_count"] = conv.get("unread_count", {}).get(user_id, 0)
            conversations.append(conv_data)
    
    return conversations

# Get messages in a conversation
@router.get("/conversations/{conversation_id}/messages")
async def get_messages(conversation_id: str, limit: int = 50, before: Optional[str] = None):
    try:
        conv_oid = ObjectId(conversation_id)
    except:
        raise HTTPException(404, "Conversation not found")
    
    # Verify conversation exists
    conv = await conversations_collection.find_one({"_id": conv_oid})
    if not conv:
        raise HTTPException(404, "Conversation not found")
    
    # Build query
    query = {"conversation_id": conversation_id, "is_deleted": False}
    
    if before:
        # Pagination: get messages before this timestamp
        query["created_at"] = {"$lt": before}
    
    # Fetch messages
    cursor = messages_collection.find(query).sort("created_at", -1).limit(limit)
    
    messages = []
    async for msg in cursor:
        msg_data = serialize_doc(msg)
        
        # Fetch sender info
        sender = await users_collection.find_one({"_id": msg["sender_id"]})
        if sender:
            msg_data["sender_name"] = sender.get("display_name") or sender.get("username")
            msg_data["sender_pic"] = sender.get("photoURL")
        
        messages.append(msg_data)
    
    # Reverse to get chronological order
    messages.reverse()
    
    return messages

# Send a message
@router.post("/conversations/{conversation_id}/messages")
async def send_message(conversation_id: str, req: MessageRequest, background_tasks: BackgroundTasks):
    # Check if DMs are disabled globally
    settings = await settings_collection.find_one({"_id": "global_settings"})
    if settings and settings.get("disable_dms"):
        sender = await users_collection.find_one({"_id": req.sender_id})
        if not sender or (sender.get("role") != "admin" and sender.get("username") != "admin"):
            raise HTTPException(status_code=403, detail="Direct messaging is currently disabled globally")
            
    try:
        conv_oid = ObjectId(conversation_id)
    except:
        raise HTTPException(404, "Conversation not found")
    
    # 1. Verify conversation exists and sender is a participant
    conv = await conversations_collection.find_one({"_id": conv_oid})
    if not conv:
        raise HTTPException(404, "Conversation not found")
    
    if req.sender_id not in conv["participants"]:
        raise HTTPException(403, "Not a participant in this conversation")
    
    # 2. Save new message
    new_message = {
        "conversation_id": conversation_id,
        "sender_id": req.sender_id,
        "content": req.content,
        "type": req.type or "text",
        "media_url": req.media_url,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "is_read": False,
        "is_deleted": False
    }
    
    result = await messages_collection.insert_one(new_message)
    message_id = str(result.inserted_id)

    # 3. Update conversation metadata
    other_user_id = [p for p in conv["participants"] if p != req.sender_id][0]
    
    await conversations_collection.update_one(
        {"_id": conv_oid},
        {
            "$set": {
                "last_message": req.content[:100],
                "last_message_at": new_message["created_at"]
            },
            "$inc": {
                f"unread_count.{other_user_id}": 1
            }
        }
    )
    
    # 4. Fetch sender info for WebSocket broadcast
    sender = await users_collection.find_one({"_id": req.sender_id})
    sender_data = serialize_doc(sender) if sender else {}
    
    # 5. WebSocket payload
    ws_payload = {
        "id": message_id,
        "conversation_id": conversation_id,
        "sender_id": req.sender_id,
        "sender_name": sender_data.get("display_name") or sender_data.get("username") or "User",
        "sender_pic": sender_data.get("photoURL"),
        "content": req.content,
        "type": new_message["type"],
        "media_url": new_message["media_url"],
        "created_at": new_message["created_at"],
        "is_read": False
    }
    
    # 6. Broadcast via WebSocket if recipient is online
    await manager.send_personal_message(other_user_id, {"type": "new_message", "message": ws_payload})

    # 7. Outgoing Federation
    participant_instances = conv.get("participant_instances", {})
    receiver_community_url = participant_instances.get(other_user_id)
    
    if receiver_community_url:
        instance_url = str(router.prefix) if hasattr(router, 'prefix') else ""
        remote_payload = {
            "sender_id": req.sender_id,
            "sender_name": ws_payload["sender_name"],
            "sender_pic": ws_payload["sender_pic"],
            "sender_community_url": instance_url,
            "receiver_id": other_user_id,
            "content": req.content,
            "type": new_message["type"],
            "media_url": new_message["media_url"],
            "timestamp": new_message["created_at"]
        }
        background_tasks.add_task(deliver_federated_message, receiver_community_url, remote_payload)
    
    return {**ws_payload, "status": "sent"}

# Receive a remote message from another instance
@router.post("/api/messages/remote")
async def receive_remote_message(req: RemoteMessageRequest):
    print(f"📡 receive_remote_message called from {req.sender_community_url} for receiver {req.receiver_id}")
    # 1. Ensure local receiver exists
    receiver = await users_collection.find_one({"_id": req.receiver_id})
    if not receiver:
        # In a real federated system, you might handle this differently (e.g., store for later)
        raise HTTPException(404, "Receiver not found on this instance")

    # 2. Get or create conversation for these participants
    participants = sorted([req.sender_id, req.receiver_id])
    conv = await conversations_collection.find_one({"participants": participants})
    
    if not conv:
        new_conv = {
            "participants": participants,
            "participant_instances": {
                req.sender_id: req.sender_community_url
            },
            "last_message": req.content[:100],
            "last_message_at": req.timestamp,
            "unread_count": {req.sender_id: 0, req.receiver_id: 1},
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        res = await conversations_collection.insert_one(new_conv)
        conversation_id = str(res.inserted_id)
    else:
        conversation_id = str(conv["_id"])
        await conversations_collection.update_one(
            {"_id": conv["_id"]},
            {
                "$set": {
                    "last_message": req.content[:100],
                    "last_message_at": req.timestamp
                },
                "$inc": {
                    f"unread_count.{req.receiver_id}": 1
                }
            }
        )

    # 3. Save message
    new_message = {
        "conversation_id": conversation_id,
        "sender_id": req.sender_id,
        "content": req.content,
        "type": req.type,
        "media_url": req.media_url,
        "created_at": req.timestamp,
        "is_read": False,
        "is_deleted": False,
        "is_remote": True,
        "sender_community_url": req.sender_community_url
    }
    result = await messages_collection.insert_one(new_message)

    # 4. Broadcast via WebSocket if recipient is online
    ws_payload = {
        "id": str(result.inserted_id),
        "conversation_id": conversation_id,
        "sender_id": req.sender_id,
        "sender_name": req.sender_name,
        "sender_pic": req.sender_pic,
        "content": req.content,
        "type": req.type,
        "media_url": req.media_url,
        "created_at": req.timestamp,
        "is_read": False,
        "is_remote": True
    }
    
    ws_message = {
        "type": "new_message",
        "message": ws_payload
    }
    
    await manager.send_personal_message(req.receiver_id, ws_message)
    
    # 5. Create local notification
    try:
        from database import notifications_collection
        notification = {
            "type": "message",
            "user_id": req.receiver_id,
            "actor_id": req.sender_id,
            "actor_name": req.sender_name,
            "actor_pic": req.sender_pic,
            "resource_id": conversation_id,
            "message": f"New message from {req.sender_name}",
            "is_read": False,
            "created_at": datetime.utcnow().isoformat()
        }
        await notifications_collection.insert_one(notification)
    except Exception as e:
        print(f"Warning: Failed to create notification: {e}")

    return {"status": "received", "message_id": str(result.inserted_id)}

# Mark messages as read
@router.put("/conversations/{conversation_id}/read")
async def mark_as_read(conversation_id: str, req: ReadRequest):
    try:
        conv_oid = ObjectId(conversation_id)
    except:
        raise HTTPException(404, "Conversation not found")
    
    # Mark all unread messages in this conversation as read
    await messages_collection.update_many(
        {
            "conversation_id": conversation_id,
            "sender_id": {"$ne": req.user_id},  # Not sent by current user
            "is_read": False
        },
        {"$set": {"is_read": True}}
    )
    
    # Reset unread count for this user
    await conversations_collection.update_one(
        {"_id": conv_oid},
        {"$set": {f"unread_count.{req.user_id}": 0}}
    )
    
    return {"status": "marked_read"}

# Delete a message
@router.delete("/messages/{message_id}")
async def delete_message(message_id: str, user_id: str):
    try:
        msg_oid = ObjectId(message_id)
    except:
        raise HTTPException(404, "Message not found")
    
    # Verify message exists and user is the sender
    message = await messages_collection.find_one({"_id": msg_oid})
    if not message:
        raise HTTPException(404, "Message not found")
    
    if message["sender_id"] != user_id:
        raise HTTPException(403, "Can only delete your own messages")
    
    # Soft delete
    await messages_collection.update_one(
        {"_id": msg_oid},
        {"$set": {"is_deleted": True}}
    )
    
    return {"status": "deleted"}

# Get total unread message count for a user
@router.get("/users/{user_id}/unread-count")
async def get_unread_count(user_id: str):
    # Sum up unread counts across all conversations
    cursor = conversations_collection.find({"participants": user_id})
    
    total_unread = 0
    async for conv in cursor:
        total_unread += conv.get("unread_count", {}).get(user_id, 0)
    
    return {"unread_count": total_unread}
