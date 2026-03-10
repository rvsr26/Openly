import requests

url = "https://openly-backend.onrender.com/api/v1/system/settings"
headers = {
    "Origin": "https://openlytalk.netlify.app",
    "Access-Control-Request-Method": "GET"
}

try:
    response = requests.options(url, headers=headers)
    print(f"Status Code: {response.status_code}")
    print("Headers:")
    for k, v in response.headers.items():
        print(f"  {k}: {v}")
    print(f"Content: {response.text}")
except Exception as e:
    print(f"Error: {e}")
