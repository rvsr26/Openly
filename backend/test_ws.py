import asyncio
import websockets

async def test():
    try:
        async with websockets.connect('ws://127.0.0.1:8000/ws/testuser') as ws:
            print("Connected!")
            await ws.send('{"type": "typing"}')
            print("Sent typing indicator")
            # Wait a bit
            await asyncio.sleep(1)
            print("Success")
    except Exception as e:
        print(f"Error: {e}")

asyncio.run(test())
