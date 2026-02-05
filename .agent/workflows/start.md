---
description: Start the entire project (Backend + Frontend + Databases)
---

This workflow starts the application using Docker Compose.

1. Navigate to the project root:
   ```powershell
   cd d:\PROJECTS\Upcomming\Failure-Sharing-Site
   ```

2. Start the services (builds if necessary):
   // turbo
   ```powershell
   docker compose up -d --build
   ```

3. View running containers:
   ```powershell
   docker ps
   ```

**Access Points:**
- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend Docs: [http://localhost:8000/docs](http://localhost:8000/docs)
