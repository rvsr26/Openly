from main import app
import json

routes = []
for route in app.routes:
    methods = getattr(route, "methods", None)
    path = getattr(route, "path", None)
    if path:
        routes.append({"path": path, "methods": list(methods) if methods else []})

print(json.dumps(routes, indent=2))
