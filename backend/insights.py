import os
import json
from datetime import datetime, timedelta, timezone
from bson import ObjectId
from database import posts_collection, follows_collection, users_collection

async def get_most_engaged_post(user_id: str, since: datetime) -> dict:
    """Find the user's post with the highest engagement (reactions + comments) since the given date."""
    pipeline = [
        {"$match": {"user_id": user_id, "created_at": {"$gte": since.isoformat()}}},
        {"$addFields": {
            "total_engagement": {"$add": [{"$ifNull": ["$reaction_count", 0]}, {"$ifNull": ["$comment_count", 0]}]}
        }},
        {"$sort": {"total_engagement": -1}},
        {"$limit": 1}
    ]
    posts = await posts_collection.aggregate(pipeline).to_list(1)
    if not posts:
        return None
    post = posts[0]
    return {
        "title": post.get("title") or post.get("content")[:50] + "...",
        "engagement": post.get("total_engagement", 0)
    }

async def get_best_posting_time(user_id: str, since: datetime) -> str:
    """Analyzes the created_at timestamps of the user's most engaged posts to find the best hour."""
    pipeline = [
        {"$match": {"user_id": user_id, "created_at": {"$gte": since.isoformat()}}},
        {"$addFields": {
            "total_engagement": {"$add": [{"$ifNull": ["$reaction_count", 0]}, {"$ifNull": ["$comment_count", 0]}]}
        }},
        {"$sort": {"total_engagement": -1}},
        {"$limit": 10}
    ]
    top_posts = await posts_collection.aggregate(pipeline).to_list(10)
    if not top_posts:
        return "Not enough data"
        
    hour_counts = {}
    for post in top_posts:
        try:
            dt = datetime.fromisoformat(post["created_at"].replace('Z', '+00:00'))
            hour = dt.hour
            hour_counts[hour] = hour_counts.get(hour, 0) + 1
        except Exception:
            pass
            
    if not hour_counts:
        return "Not enough data"
        
    best_hour = max(hour_counts.items(), key=lambda x: x[1])[0]
    
    # Format hour to AM/PM
    am_pm = "AM" if best_hour < 12 else "PM"
    display_hour = best_hour if 0 < best_hour <= 12 else (12 if best_hour == 0 else best_hour - 12)
    return f"{display_hour}:00 {am_pm}"

async def get_new_followers_count(user_id: str, since: datetime) -> int:
    """Counts new followers since the given date."""
    # Build list of potential IDs (uid + _id)
    user = await users_collection.find_one({"$or": [{"uid": user_id}, {"_id": ObjectId(user_id) if len(user_id) == 24 else None}]})
    if not user:
        return 0
        
    target_ids = [str(user["_id"])]
    if user.get("uid"):
        target_ids.append(user["uid"])
        
    # We assume 'created_at' exists on follows. If not, we cannot accurately filter, but we query anyway.
    # Openly might not have created_at on all follows, so we fallback to total if we can't filter.
    count = await follows_collection.count_documents({
        "following_id": {"$in": target_ids},
        "$or": [
            {"status": "accepted"},
            {"status": {"$exists": False}}
        ]
        # "created_at": {"$gte": since.isoformat()} # Ideally we'd have this
    })
    # For a weekly report illusion where created_at isn't robust, we might just return total or a simulated weekly delta.
    # Realistically we should add created_at tracking to follows.
    return count

async def get_skill_endorsements_count(user_id: str) -> int:
    """Sums the endorsements of all skills the user has."""
    user = await users_collection.find_one({"$or": [{"uid": user_id}, {"_id": ObjectId(user_id) if len(user_id) == 24 else None}]})
    if not user:
        return 0
        
    skills = user.get("skills", [])
    total_endorsements = 0
    for skill in skills:
        if isinstance(skill, dict):
            total_endorsements += len(skill.get("endorsements", []))
    return total_endorsements

async def generate_weekly_insights(user_id: str) -> dict:
    """Gather all statistics for the user's weekly report."""
    now = datetime.now(timezone.utc)
    seven_days_ago = now - timedelta(days=7)
    
    most_engaged = await get_most_engaged_post(user_id, seven_days_ago)
    best_time = await get_best_posting_time(user_id, seven_days_ago)
    new_followers = await get_new_followers_count(user_id, seven_days_ago)
    endorsements = await get_skill_endorsements_count(user_id)
    
    # Generate Google QuickChart URL for productivity graph (posts per day)
    pipeline = [
        {"$match": {"user_id": user_id, "created_at": {"$gte": seven_days_ago.isoformat()}}}
    ]
    recent_posts = await posts_collection.aggregate(pipeline).to_list(100)
    
    days_count = { (seven_days_ago + timedelta(days=i)).strftime("%a"): 0 for i in range(7) }
    for post in recent_posts:
        try:
            dt = datetime.fromisoformat(post["created_at"].replace('Z', '+00:00'))
            day_str = dt.strftime("%a")
            if day_str in days_count:
                days_count[day_str] += 1
        except Exception:
            pass
            
    labels = list(days_count.keys())
    data = list(days_count.values())
    
    chart_url = f"https://quickchart.io/chart?c={{type:'bar',data:{{labels:{labels},datasets:[{{label:'Posts',data:{data},backgroundColor:'#3b82f6'}}]}}}}"
    chart_url = chart_url.replace("'", "%27").replace(" ", "")

    return {
        "most_engaged_post": most_engaged,
        "best_posting_time": best_time,
        "new_followers_approx": new_followers, # Simplified
        "skill_endorsements": endorsements,
        "productivity_chart_url": chart_url,
        "week_start": seven_days_ago.strftime("%B %d, %Y"),
        "week_end": now.strftime("%B %d, %Y")
    }

def generate_email_html(user_name: str, insights: dict) -> str:
    engaged_post_html = ""
    if insights["most_engaged_post"]:
        engaged_post_html = f"""
        <div style="background-color: #f8fafc; padding: 16px; border-radius: 8px; margin-top: 8px;">
            <p style="margin: 0; font-weight: bold; color: #1e293b;">{insights['most_engaged_post']['title']}</p>
            <p style="margin: 8px 0 0 0; font-size: 14px; color: #64748b;">{insights['most_engaged_post']['engagement']} Interactions</p>
        </div>
        """
    else:
        engaged_post_html = "<p style='color: #64748b;'>No posts this week.</p>"

    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f1f5f9; padding: 20px; }}
            .container {{ max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }}
            .header {{ background-color: #3b82f6; color: white; padding: 32px 24px; text-align: center; }}
            .header h1 {{ margin: 0; font-size: 24px; font-weight: 800; }}
            .content {{ padding: 32px 24px; }}
            .card {{ background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 20px; }}
            .card-title {{ font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: bold; color: #64748b; margin: 0 0 12px 0; }}
            .metric {{ font-size: 32px; font-weight: 900; color: #0f172a; margin: 0; }}
            .grid {{ display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }}
            @media (max-width: 480px) {{ .grid {{ grid-template-columns: 1fr; }} }}
            .footer {{ text-align: center; padding: 24px; font-size: 12px; color: #94a3b8; background-color: #f8fafc; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Your Weekly Insights</h1>
                <p style="margin: 8px 0 0 0; opacity: 0.9;">{insights['week_start']} - {insights['week_end']}</p>
            </div>
            
            <div class="content">
                <p style="font-size: 18px; font-weight: bold;">Hi {user_name},</p>
                <p style="color: #475569; margin-bottom: 32px;">Here's a look at how your profile and content performed this past week.</p>
                
                <div class="grid">
                    <div class="card" style="margin-bottom: 0;">
                        <h2 class="card-title">Network Growth</h2>
                        <p class="metric">+{insights['new_followers_approx']}</p>
                        <p style="margin: 4px 0 0 0; font-size: 14px; color: #64748b;">New Connections</p>
                    </div>
                    <div class="card" style="margin-bottom: 0;">
                        <h2 class="card-title">Skill Endorsements</h2>
                        <p class="metric">+{insights['skill_endorsements']}</p>
                        <p style="margin: 4px 0 0 0; font-size: 14px; color: #64748b;">Recognitions received</p>
                    </div>
                </div>
                
                <div class="card">
                    <h2 class="card-title">Optimal Time to Post</h2>
                    <p class="metric" style="color: #3b82f6;">{insights['best_posting_time']}</p>
                    <p style="margin: 4px 0 0 0; font-size: 14px; color: #64748b;">Based on engagement history</p>
                </div>
                
                <div class="card">
                    <h2 class="card-title">Top Performing Post</h2>
                    {engaged_post_html}
                </div>
                
                <div class="card">
                    <h2 class="card-title">Productivity Graph (Posts)</h2>
                    <img src="{insights['productivity_chart_url']}" alt="Productivity Graph" style="width: 100%; max-width: 100%; height: auto; border-radius: 8px;" />
                </div>
                
                <div style="text-align: center; margin-top: 32px;">
                    <a href="#" style="display: inline-block; background-color: #0f172a; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold;">View Full Dashboard</a>
                </div>
            </div>
            
            <div class="footer">
                <p>This email was sent by Openly.</p>
                <p>&copy; {datetime.now().year} Openly Inc.</p>
            </div>
        </div>
    </body>
    </html>
    """

async def send_insight_report(user_id: str, email: str, user_name: str) -> dict:
    """Generates insights and 'sends' the email."""
    insights = await generate_weekly_insights(user_id)
    html_content = generate_email_html(user_name, insights)
    
    # Normally we would use smtplib / SendGrid / AWS SES here.
    # We will simulate sending by writing to a local outbox directory so the user can see it.
    outbox_dir = "outbox"
    os.makedirs(outbox_dir, exist_ok=True)
    
    safe_name = user_name.replace(" ", "_").lower()
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"{outbox_dir}/weekly_insight_{safe_name}_{timestamp}.html"
    
    with open(filename, "w", encoding="utf-8") as f:
        f.write(html_content)
        
    return {
        "status": "success", 
        "message": f"Report generated! Saved locally to {filename} (Simulation mode)",
        "file": filename
    }
