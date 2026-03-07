import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
import json

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
client = AsyncIOMotorClient(MONGODB_URL)
db = client["failure_db"]
reports_collection = db["reports"]

async def get_reports():
    reports = []
    async for report in reports_collection.find():
        report["_id"] = str(report["_id"])
        # Format dates if they exist
        if "created_at" in report and hasattr(report["created_at"], "isoformat"):
            report["created_at"] = report["created_at"].isoformat()
        reports.append(report)
    return reports

async def main():
    reports = await get_reports()
    print(json.dumps(reports, indent=2))

if __name__ == "__main__":
    asyncio.run(main())
