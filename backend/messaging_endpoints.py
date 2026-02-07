from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import json
from bson import ObjectId
from websocket_manager import manager
from database import (
    follows_collection, 
    conversations_collection, 
    messages_collection, 
    users_collection
)

router = APIRouter()

# Helper function
def serialize_doc(doc):
    if not doc: return None
    doc["id"] = str(doc["_id"])
    del doc["_id"]
    return doc

class ConversationRequest(BaseModel):
    user_id: str
    target_user_id: str

class MessageRequest(BaseModel):
    sender_id: str
    content: str

class ReadRequest(BaseModel):
    user_id: str

# WebSocket endpoint for real-time messaging
@router.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    await manager.connect(user_id, websocket)
    try:
        while True:
            # Keep connection alive and listen for messages
            data = await websocket.receive_text()
            # Handle incoming WebSocket messages (typing indicators, etc.)
            try:
                message_data = json.loads(data)
                if message_data.get("type") == "typing":
                    # Broadcast typing indicator to other participant
                    conversation_id = message_data.get("conversation_id")
                    if conversation_id:
                        conv = await conversations_collection.find_one({"_id": ObjectId(conversation_id)})
                        if conv:
                            other_user = [p for p in conv["participants"] if p != user_id][0]
                            await manager.send_typing_indicator(other_user, conversation_id, message_data.get("is_typing", False))
            except:
                pass
    except WebSocketDisconnect:
        manager.disconnect(user_id)

# Create or get existing conversation
@router.post("/conversations/")
async def create_or_get_conversation(req: ConversationRequest):
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
        "last_message": "",
        "last_message_at": datetime.utcnow().isoformat(),
        "unread_count": {req.user_id: 0, req.target_user_id: 0},
        "created_at": datetime.utcnow().isoformat()
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
async def send_message(conversation_id: str, req: MessageRequest):
    try:
        conv_oid = ObjectId(conversation_id)
    except:
        raise HTTPException(404, "Conversation not found")
    
    # Verify conversation exists and sender is a participant
    conv = await conversations_collection.find_one({"_id": conv_oid})
    if not conv:
        raise HTTPException(404, "Conversation not found")
    
    if req.sender_id not in conv["participants"]:
        raise HTTPException(403, "Not a participant in this conversation")
    
    # Create message
    new_message = {
        "conversation_id": conversation_id,
        "sender_id": req.sender_id,
        "content": req.content,
        "created_at": datetime.utcnow().isoformat(),
        "is_read": False,
        "is_deleted": False
    }
    
    result = await messages_collection.insert_one(new_message)
    
    # Update conversation metadata
    other_user_id = [p for p in conv["participants"] if p != req.sender_id][0]
    
    await conversations_collection.update_one(
        {"_id": conv_oid},
        {
            "$set": {
                "last_message": req.content[:100],  # Store preview
                "last_message_at": new_message["created_at"]
            },
            "$inc": {
                f"unread_count.{other_user_id}": 1
            }
        }
    )
    
    # Fetch sender info for WebSocket broadcast
    sender = await users_collection.find_one({"_id": req.sender_id})
    
    # Broadcast via WebSocket if recipient is online
    ws_message = {
        "type": "new_message",
        "message": {
            "id": str(result.inserted_id),
            "conversation_id": conversation_id,
            "sender_id": req.sender_id,
            "sender_name": sender.get("display_name") if sender else "User",
            "sender_pic": sender.get("photoURL") if sender else None,
            "content": req.content,
            "created_at": new_message["created_at"],
            "is_read": False
        }
    }
    
    await manager.send_personal_message(other_user_id, ws_message)
    
    # Return the created message
    return {
        "id": str(result.inserted_id),
        "conversation_id": conversation_id,
        "sender_id": req.sender_id,
        "sender_name": sender.get("display_name") if sender else "User",
        "sender_pic": sender.get("photoURL") if sender else None,
        "content": req.content,
        "created_at": new_message["created_at"],
        "is_read": False,
        "status": "sent"
    }

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
