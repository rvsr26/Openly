import requests

# 1. Get token
res1 = requests.post('http://127.0.0.1:8000/api/v1/auth/sync', json={"uid": "testuser", "email": "testuser@example.com"})
data = res1.json()
token = data.get('access_token')
print("Token:", token[:20], "...")

# 2. Test /me
res2 = requests.get('http://127.0.0.1:8000/api/v1/auth/me', headers={"Authorization": f"Bearer {token}"})
print("Me status:", res2.status_code)
print("Me response:", res2.json())
