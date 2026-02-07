from fastapi import WebSocket
from typing import Dict, List
import json
from datetime import datetime, timezone

class ConnectionManager:
    """Manages WebSocket connections for real-time messaging."""
    
    def __init__(self):
        # Dictionary mapping user_id to WebSocket connection
        self.active_connections: Dict[str, WebSocket] = {}
    
    async def connect(self, user_id: str, websocket: WebSocket):
        """Register a new WebSocket connection for a user."""
        await websocket.accept()
        self.active_connections[user_id] = websocket
        print(f"✅ User {user_id} connected to WebSocket")
    
    def disconnect(self, user_id: str):
        """Remove a user's WebSocket connection."""
        if user_id in self.active_connections:
            del self.active_connections[user_id]
            print(f"❌ User {user_id} disconnected from WebSocket")
    
    async def send_personal_message(self, user_id: str, message: dict):
        """Send a message to a specific user if they're online."""
        if user_id in self.active_connections:
            try:
                websocket = self.active_connections[user_id]
                await websocket.send_json(message)
                return True
            except Exception as e:
                print(f"Error sending message to {user_id}: {e}")
                # Connection might be stale, remove it
                self.disconnect(user_id)
                return False
        return False
    
    async def broadcast_to_conversation(self, participant_ids: List[str], message: dict):
        """Send a message to all participants in a conversation who are online."""
        sent_count = 0
        for user_id in participant_ids:
            if await self.send_personal_message(user_id, message):
                sent_count += 1
        return sent_count
    
    def is_user_online(self, user_id: str) -> bool:
        """Check if a user is currently connected."""
        return user_id in self.active_connections
    
    async def send_typing_indicator(self, user_id: str, conversation_id: str, is_typing: bool):
        """Send typing indicator to a user."""
        message = {
            "type": "typing",
            "conversation_id": conversation_id,
            "is_typing": is_typing,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        await self.send_personal_message(user_id, message)

# Global connection manager instance
manager = ConnectionManager()
