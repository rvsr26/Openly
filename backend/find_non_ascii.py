with open('main.py', 'r', encoding='utf-8', errors='ignore') as f:
    for i, line in enumerate(f, 1):
        if any(ord(c) > 127 for c in line):
            print(f"Line {i}: {line.strip()}")
