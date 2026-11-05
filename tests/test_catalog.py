import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "backend"))
os.environ["DB_NAME"] = "dramabox_poc_test"

import pytest
from fastapi.testclient import TestClient

import server


@pytest.fixture()
def client():
    from pymongo import MongoClient
    MongoClient(os.environ.get("MONGO_URL", "mongodb://localhost:27017")).drop_database("dramabox_poc_test")
    with TestClient(server.app) as c:
        yield c


def test_health(client):
    body = client.get("/api/health").json()
    assert body["ok"] is True and body["release"]


def test_home_has_hero_and_rails(client):
    body = client.get("/api/home").json()
    assert len(body["hero"]) == 5
    assert {r["key"] for r in body["rails"]} >= {"trending", "new", "romance"}
    assert "_id" not in body["hero"][0]


def test_series_filter_and_detail(client):
    ceo = client.get("/api/series", params={"category": "CEO"}).json()
    assert ceo and all(s["category"] == "CEO" for s in ceo)
    detail = client.get(f"/api/series/{ceo[0]['id']}").json()
    assert len(detail["episodes"]) == detail["episode_count"]
    assert [e["cost"] for e in detail["episodes"][:6]] == [0, 0, 0, 0, 0, 60]


def test_unknown_series_404(client):
    assert client.get("/api/series/nope").status_code == 404
