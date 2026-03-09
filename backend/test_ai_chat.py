import requests
import json

url = "http://localhost:8000/api/v1/ai/chat"
payload = {
    "message": "Hello from python testing script",
    "history": []
}
headers = {
    "Content-Type": "application/json"
}

try:
    response = requests.post(url, json=payload)
    print("Status Code:", response.status_code)
    try:
        print("Response JSON:", json.dumps(response.json(), indent=2))
    except BaseException as e:
        print("Raw Response:", response.text)
except Exception as e:
    print("Error:", e)
