import sys

try:
    with open('d:/PROJECTS/Upcomming/Openly/backend/backend_logs.txt', 'r', encoding='utf-16le') as f:
        content = f.read()
    with open('d:/PROJECTS/Upcomming/Openly/backend/backend_logs_debug.txt', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Log converted successfully to backend_logs_debug.txt")
except Exception as e:
    print(f"Error: {e}")
