import os
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv
from fastapi import APIRouter, FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from motor.motor_asyncio import AsyncIOMotorClient
from starlette.middleware.cors import CORSMiddleware

from seed import CATEGORIES, seed_if_empty
from version import RELEASE

ROOT = Path(__file__).parent
load_dotenv(ROOT / ".env")


class _Db:
    """Late-bound handle so the Motor client is created inside the running event loop."""
    client = None

    def __getattr__(self, name):
        return getattr(self.client[os.environ.get("DB_NAME", "dramabox_poc")], name)


db = _Db()


@asynccontextmanager
async def lifespan(_app):
    db.client = AsyncIOMotorClient(os.environ.get("MONGO_URL", "mongodb://localhost:27017"))
    await seed_if_empty(db)
    yield
    db.client.close()


app = FastAPI(title="DramaBox PoC", lifespan=lifespan)
api = APIRouter(prefix="/api")


NO_ID = {"_id": 0}


@api.get("/health")
async def health():
    return {"ok": True, "release": RELEASE}


@api.get("/categories")
async def categories():
    return CATEGORIES


@api.get("/series")
async def list_series(category: Optional[str] = None):
    query = {"category": category} if category and category != "For You" else {}
    return await db.series.find(query, NO_ID).sort("trending_rank", 1).to_list(100)


@api.get("/home")
async def home():
    everything = await db.series.find({}, NO_ID).sort("trending_rank", 1).to_list(100)
    rails = [
        {"key": "trending", "title": "Trending now", "items": everything[:8]},
        {"key": "new", "title": "New releases",
         "items": sorted(everything, key=lambda s: -s["released_order"])[:8]},
    ]
    for cat in CATEGORIES[1:]:
        items = [s for s in everything if s["category"] == cat]
        if items:
            rails.append({"key": cat.lower(), "title": cat, "items": items})
    return {"hero": [s for s in everything if s["featured"]], "rails": rails}


@api.get("/series/{series_id}")
async def series_detail(series_id: str):
    series = await db.series.find_one({"id": series_id}, NO_ID)
    if not series:
        raise HTTPException(404, "Series not found")
    episodes = await db.episodes.find({"series_id": series_id}, NO_ID).sort("number", 1).to_list(500)
    return {**series, "episodes": episodes}


app.include_router(api)

media_dir = ROOT / "media"
media_dir.mkdir(exist_ok=True)
app.mount("/api/media", StaticFiles(directory=media_dir), name="media")

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)

