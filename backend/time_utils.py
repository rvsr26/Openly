from datetime import datetime, timezone, timedelta

def get_now():
    """Returns current datetime in GMT+5:30 (IST)"""
    # GMT+5:30
    ist_tz = timezone(timedelta(hours=5, minutes=30))
    return datetime.now(ist_tz)

def get_now_iso():
    """Returns current ISO 8601 string in GMT+5:30 (IST)"""
    return get_now().isoformat()
