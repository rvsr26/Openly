from main import app
import json

routes = []
for route in app.routes:
    methods = getattr(route, "methods", None)
    path = getattr(route, "path", None)
    if path: # Look for any /admin/ or /api/v1/admin/
        if "/admin/" in path:
            routes.append({"path": path, "methods": list(methods) if methods else []})

# Sort by path length for easier reading
routes.sort(key=lambda x: x["path"])
with open("admin_routes.json", "w") as f:
    json.dump(routes, f, indent=2)
print(f"Dumped {len(routes)} admin routes to admin_routes.json")
