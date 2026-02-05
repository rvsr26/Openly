---
description: Start the Backend server locally
---

1. Open a new terminal
2. Navigate to the backend directory
   ```powershell
   cd failure-backend
   ```
3. Activate the virtual environment
   ```powershell
   .\venv\Scripts\Activate
   ```
4. Install dependencies (optional but recommended for first run)
   ```powershell
   pip install -r requirements.txt
   ```
5. Start the server
   ```powershell
   uvicorn main:app --reload --port 8000
   ```
