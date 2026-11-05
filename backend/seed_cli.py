"""One-off: seed the database named by MONGO_URL / DB_NAME (e.g. Atlas) before first deploy.

    MONGO_URL="mongodb+srv://..." python seed_cli.py
"""
import asyncio
import os

from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

from seed import seed_if_empty

load_dotenv()


async def main():
    client = AsyncIOMotorClient(os.environ["MONGO_URL"])
    db = client[os.environ.get("DB_NAME", "dramabox_poc")]
    first_run = await seed_if_empty(db)
    print("seeded episodes" if first_run else "series upserted; episodes already present")
    client.close()


asyncio.run(main())
