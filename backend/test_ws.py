import asyncio
import websockets

async def test_ws():
    uri = "wss://openly-backend.onrender.com/ws/TEST_USER_123"
    print(f"Connecting to {uri}...")
    try:
        async with websockets.connect(uri) as websocket:
            print("Connected!")
            await websocket.send('{"type": "ping"}')
            response = await websocket.recv()
            print(f"Received: {response}")
    except Exception as e:
        print(f"Error: {e}")

asyncio.run(test_ws())
