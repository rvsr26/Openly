import httpx
import asyncio
import json
from datetime import datetime

BASE_URL = "http://127.0.0.1:8001"

async def test_federation_flow():
    print("🚀 Starting Messaging Federation Verification...")
    
    # 1. Create a local conversation with a remote user metadata
    # We'll simulate a conversation where the target user is on a "remote" instance
    user_id = "local_test_user"
    remote_user_id = "remote_test_user"
    remote_community_url = "http://mock-remote-instance.com"
    
    # 0. Ensure local user exists
    print(f"Ensuring local user {user_id} exists...")
    async with httpx.AsyncClient(timeout=10.0) as client:
        # Check if user exists (simple check via debug script or just try to create)
        # For simplicity, we'll try to use a registration endpoint if available, 
        # but since we are mocking, we can just assume we need to handle it.
        # However, the backend expects the user to be in the database.
        # We'll use a manual check/create logic if we had one, 
        # or we'll assume the environment has it.
        # EXPERIMENT: Let's see if we can just create it via a mock POST to /auth/register or similar if it exists.
        # Actually, let's just use the existing users_collection if we were running inside the backend, 
        # but this is an external script.
        pass
    
    print(f"Creating/Getting conversation for {user_id} and {remote_user_id}...")
    # Using a 10s timeout to be safe
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            conv_res = await client.post(
                f"{BASE_URL}/conversations/",
                json={
                    "user_id": user_id,
                    "target_user_id": remote_user_id,
                    "target_community_url": remote_community_url
                }
            )
            conv_res.raise_for_status()
            conversation = conv_res.json()
            conversation_id = conversation["id"]
            print(f"✅ Conversation created: {conversation_id}")
            
            # 2. Test sending a message to the remote user
            print("Sending message to remote user...")
            msg_res = await client.post(
                f"{BASE_URL}/conversations/{conversation_id}/messages",
                json={
                    "sender_id": user_id,
                    "content": "Hello remote world!",
                    "type": "text"
                }
            )
            msg_res.raise_for_status()
            print("✅ Message sent successfully (Federation triggered in backend)")
                
            # 3. Test receiving a remote message
            print("Simulating incoming remote message...")
            remote_msg_payload = {
                "sender_id": remote_user_id,
                "sender_name": "Remote User",
                "sender_pic": None,
                "sender_community_url": remote_community_url,
                "receiver_id": user_id,
                "content": "Hello local world! I am responding.",
                "type": "text",
                "timestamp": datetime.utcnow().isoformat()
            }
            
            recv_res = await client.post(
                f"{BASE_URL}/api/messages/remote",
                json=remote_msg_payload
            )
            recv_res.raise_for_status()
            print(f"✅ Remote message received: {recv_res.json()}")
                
            # 4. Verify messages in conversation
            print("Fetching messages for conversation...")
            msgs_res = await client.get(f"{BASE_URL}/conversations/{conversation_id}/messages")
            msgs_res.raise_for_status()
            messages = msgs_res.json()
            print(f"✅ Found {len(messages)} messages in conversation")
            for m in messages:
                print(f"  - [{m.get('sender_id')}] {m.get('content')}")
        except httpx.HTTPStatusError as e:
            print(f"❌ HTTP Error: {e.response.status_code}")
            print(f"Response Body: {e.response.text}")
        except Exception as e:
            import traceback
            print(f"❌ Unexpected Error: {type(e).__name__}: {e}")
            traceback.print_exc()

if __name__ == "__main__":
    BASE_URL = "http://127.0.0.1:8000"
    asyncio.run(test_federation_flow())
