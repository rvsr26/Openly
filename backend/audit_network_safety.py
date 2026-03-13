import os

for root, dirs, files in os.walk('.'):
    # Skip venv and __pycache__
    if 'venv' in root or '__pycache__' in root:
        continue
    for file in files:
        if file.endswith('.py'):
            path = os.path.join(root, file)
            try:
                with open(path, 'r', encoding='utf-8') as f:
                    for i, line in enumerate(f, 1):
                        if any(ord(c) > 127 for c in line):
                            print(f"{path} Line {i}: {line.strip()}")
            except Exception as e:
                print(f"Error reading {path}: {e}")
