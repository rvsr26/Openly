import requests
res = requests.post('http://127.0.0.1:8000/api/v1/auth/sync', json={"uid": "testuser", "email": "test@example.com"})
print(res.json())
