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


@pytest.fixture()
def guest(client):
    g = client.post("/api/guest").json()
    return {"X-Guest-Id": g["id"]}


@pytest.fixture()
def paid_episode(client):
    series = client.get("/api/series").json()[0]
    return client.get(f"/api/series/{series['id']}").json()["episodes"][5]  # episode 6, cost 60


def test_new_guest_gets_starting_coins(client, guest):
    assert client.get("/api/me", headers=guest).json()["coins"] == 200


def test_guest_endpoint_is_idempotent(client, guest):
    again = client.post("/api/guest", headers=guest).json()
    assert again["id"] == guest["X-Guest-Id"] and again["coins"] == 200


def test_requires_guest_header(client):
    assert client.get("/api/me").status_code == 401


def test_unlock_deducts_once(client, guest, paid_episode):
    first = client.post(f"/api/episodes/{paid_episode['id']}/unlock", headers=guest).json()
    second = client.post(f"/api/episodes/{paid_episode['id']}/unlock", headers=guest).json()
    assert first["coins"] == 140 and second["coins"] == 140


def test_unlock_marks_episode_unlocked_in_detail(client, guest, paid_episode):
    client.post(f"/api/episodes/{paid_episode['id']}/unlock", headers=guest)
    eps = client.get(f"/api/series/{paid_episode['series_id']}", headers=guest).json()["episodes"]
    assert eps[4]["locked"] is False and eps[5]["locked"] is False and eps[6]["locked"] is True


def test_unlock_insufficient_coins(client, guest):
    series = client.get("/api/series").json()[0]
    eps = client.get(f"/api/series/{series['id']}").json()["episodes"]
    results = [client.post(f"/api/episodes/{e['id']}/unlock", headers=guest) for e in eps[5:10]]
    assert [r.status_code for r in results] == [200, 200, 200, 402, 402]  # 200 coins = 3 episodes
    assert client.get("/api/me", headers=guest).json()["coins"] == 20


def test_topup_and_checkin(client, guest):
    assert client.post("/api/wallet/topup", json={"pack": "small"}, headers=guest).json()["coins"] == 500
    assert client.post("/api/wallet/topup", json={"pack": "bogus"}, headers=guest).status_code == 400
    assert client.post("/api/checkin", headers=guest).json()["coins"] == 520
    assert client.post("/api/checkin", headers=guest).status_code == 409
    assert client.get("/api/me", headers=guest).json()["checked_in_today"] is True


def test_my_list_roundtrip(client, guest):
    sid = client.get("/api/series").json()[0]["id"]
    client.post(f"/api/list/{sid}", headers=guest)
    client.post(f"/api/list/{sid}", headers=guest)
    assert [s["id"] for s in client.get("/api/library", headers=guest).json()["saved"]] == [sid]
    client.delete(f"/api/list/{sid}", headers=guest)
    assert client.get("/api/library", headers=guest).json()["saved"] == []


def test_progress_shows_in_continue_watching(client, guest, paid_episode):
    client.post("/api/progress", json={"episode_id": paid_episode["id"], "position": 31.5}, headers=guest)
    cw = client.get("/api/library", headers=guest).json()["continue_watching"]
    assert cw[0]["id"] == paid_episode["series_id"]
    assert cw[0]["progress"]["number"] == 6 and cw[0]["progress"]["position"] == 31.5
