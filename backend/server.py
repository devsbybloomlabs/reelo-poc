import os
import re
import uuid
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv
from fastapi import APIRouter, Depends, FastAPI, Header, HTTPException
from fastapi.staticfiles import StaticFiles
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel
from pymongo import ReturnDocument
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
async def series_detail(series_id: str, x_guest_id: Optional[str] = Header(None)):
    series = await db.series.find_one({"id": series_id}, NO_ID)
    if not series:
        raise HTTPException(404, "Series not found")
    episodes = await db.episodes.find({"series_id": series_id}, NO_ID).sort("number", 1).to_list(500)
    guest = await db.guests.find_one({"id": x_guest_id}, NO_ID) if x_guest_id else None
    unlocked = set(guest["unlocked"]) if guest else set()
    for ep in episodes:
        ep["locked"] = ep["cost"] > 0 and ep["id"] not in unlocked
    return {**series, "episodes": episodes}


# ---- search, discover, feed -------------------------------------------------

@api.get("/search")
async def search(q: str = ""):
    q = q.strip()[:80]
    if not q:
        return []
    rx = {"$regex": re.escape(q), "$options": "i"}
    query = {"$or": [{"title": rx}, {"themes": rx}, {"tags": rx}]}
    return await db.series.find(query, NO_ID).sort("trending_rank", 1).to_list(30)


@api.get("/search/discover")
async def discover():
    by_rank = await db.series.find({}, NO_ID).sort("trending_rank", 1).to_list(100)
    by_views = sorted(by_rank, key=lambda s: -s["views"])
    return {"hot": [s["title"] for s in by_rank[:8]], "trending": by_views[:10]}


@api.get("/feed")
async def feed():
    series = await db.series.find({}, NO_ID).sort("trending_rank", 1).to_list(100)
    firsts = await db.episodes.find({"number": 1}, NO_ID).to_list(500)
    by_series = {e["series_id"]: e for e in firsts}
    return [
        {**s, "first_episode": {"id": by_series[s["id"]]["id"], "video_url": by_series[s["id"]]["video_url"]}}
        for s in series if s["id"] in by_series
    ]


# ---- guests, coins, unlocks -------------------------------------------------

STARTING_COINS = 200
CHECKIN_REWARD = 20
TOPUP_PACKS = {"small": 300, "medium": 700, "large": 1500}


def _today():
    return datetime.now(timezone.utc).date().isoformat()


def _public_guest(g):
    return {
        "id": g["id"],
        "coins": g["coins"],
        "vip": False,
        "checked_in_today": g.get("last_checkin") == _today(),
        "list": g["list"],
    }


async def current_guest(x_guest_id: Optional[str] = Header(None)):
    if not x_guest_id:
        raise HTTPException(401, "Missing X-Guest-Id")
    guest = await db.guests.find_one({"id": x_guest_id}, NO_ID)
    if not guest:
        raise HTTPException(401, "Unknown guest")
    return guest


@api.post("/guest")
async def create_guest(x_guest_id: Optional[str] = Header(None)):
    if x_guest_id:
        existing = await db.guests.find_one({"id": x_guest_id}, NO_ID)
        if existing:
            return _public_guest(existing)
    guest = {"id": str(uuid.uuid4()), "coins": STARTING_COINS, "last_checkin": None,
             "list": [], "unlocked": [], "progress": {}}
    await db.guests.insert_one(dict(guest))
    return _public_guest(guest)


@api.get("/me")
async def me(guest=Depends(current_guest)):
    return _public_guest(guest)


@api.post("/episodes/{episode_id}/unlock")
async def unlock_episode(episode_id: str, guest=Depends(current_guest)):
    ep = await db.episodes.find_one({"id": episode_id}, NO_ID)
    if not ep:
        raise HTTPException(404, "Episode not found")
    if ep["cost"] == 0 or episode_id in guest["unlocked"]:
        return {"coins": guest["coins"], "unlocked": True}
    result = await db.guests.find_one_and_update(
        {"id": guest["id"], "coins": {"$gte": ep["cost"]}, "unlocked": {"$ne": episode_id}},
        {"$inc": {"coins": -ep["cost"]}, "$addToSet": {"unlocked": episode_id}},
        projection=NO_ID, return_document=ReturnDocument.AFTER,
    )
    if result is None:
        fresh = await db.guests.find_one({"id": guest["id"]}, NO_ID)
        if episode_id in fresh["unlocked"]:
            return {"coins": fresh["coins"], "unlocked": True}
        raise HTTPException(402, "Not enough coins")
    return {"coins": result["coins"], "unlocked": True}


class TopUp(BaseModel):
    pack: str


@api.post("/wallet/topup")
async def topup(body: TopUp, guest=Depends(current_guest)):
    if body.pack not in TOPUP_PACKS:
        raise HTTPException(400, "Unknown pack")
    result = await db.guests.find_one_and_update(
        {"id": guest["id"]}, {"$inc": {"coins": TOPUP_PACKS[body.pack]}},
        projection=NO_ID, return_document=ReturnDocument.AFTER)
    return {"coins": result["coins"]}


@api.post("/checkin")
async def checkin(guest=Depends(current_guest)):
    result = await db.guests.find_one_and_update(
        {"id": guest["id"], "last_checkin": {"$ne": _today()}},
        {"$inc": {"coins": CHECKIN_REWARD}, "$set": {"last_checkin": _today()}},
        projection=NO_ID, return_document=ReturnDocument.AFTER)
    if result is None:
        raise HTTPException(409, "Already checked in today")
    return {"coins": result["coins"], "reward": CHECKIN_REWARD}


# ---- My List, progress, library --------------------------------------------

@api.post("/list/{series_id}")
async def add_to_list(series_id: str, guest=Depends(current_guest)):
    if not await db.series.find_one({"id": series_id}):
        raise HTTPException(404, "Series not found")
    await db.guests.update_one({"id": guest["id"]}, {"$addToSet": {"list": series_id}})
    return {"saved": True}


@api.delete("/list/{series_id}")
async def remove_from_list(series_id: str, guest=Depends(current_guest)):
    await db.guests.update_one({"id": guest["id"]}, {"$pull": {"list": series_id}})
    return {"saved": False}


class Progress(BaseModel):
    episode_id: str
    position: float


@api.post("/progress")
async def save_progress(body: Progress, guest=Depends(current_guest)):
    ep = await db.episodes.find_one({"id": body.episode_id}, NO_ID)
    if not ep:
        raise HTTPException(404, "Episode not found")
    entry = {"episode_id": ep["id"], "number": ep["number"], "position": body.position,
             "duration": ep["duration"], "updated_at": datetime.now(timezone.utc).isoformat()}
    await db.guests.update_one({"id": guest["id"]}, {"$set": {f"progress.{ep['series_id']}": entry}})
    return {"ok": True}


@api.get("/library")
async def library(guest=Depends(current_guest)):
    saved = await db.series.find({"id": {"$in": guest["list"]}}, NO_ID).to_list(100)
    progress = guest.get("progress", {})
    watching = await db.series.find({"id": {"$in": list(progress)}}, NO_ID).to_list(100)
    continue_watching = sorted(
        ({**s, "progress": progress[s["id"]]} for s in watching),
        key=lambda s: s["progress"]["updated_at"], reverse=True)
    return {"saved": saved, "continue_watching": continue_watching}


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

