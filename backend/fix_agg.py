
import os

def fix_aggregation():
    path = r"d:\PROJECTS\Openly\backend\main.py"
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    
    # Target the specific hot sort pipeline part
    old_fragment = """            {
                "$addFields": {
                    "ts": {"$toLong": {"$dateFromString": {"dateString": "$created_at"}}}
                }
            },"""
    
    new_fragment = """            {
                "$addFields": {
                    "ts": {
                        "$cond": {
                            "if": {"$eq": [{"$type": "$created_at"}, "date"]},
                            "then": {"$toLong": "$created_at"},
                            "else": {"$toLong": {"$dateFromString": {"dateString": {"$ifNull": ["$created_at", "2024-01-01T00:00:00Z"]}}}}
                        }
                    }
                }
            },"""
    
    if old_fragment in content:
        content = content.replace(old_fragment, new_fragment)
        with open(path, "w", encoding="utf-8") as f:
            f.write(content)
        print("Successfully updated hot sort aggregation.")
    else:
        print("Fragment not found in main.py. Check line endings or structure.")

if __name__ == "__main__":
    fix_aggregation()
