"""Backend API tests for Moodful mental-wellness app.

Tests cover:
- Auth: register / login / me (JWT)
- Entries CRUD: create, list mine, calendar filter, community (public only), react toggle
- Tasks CRUD: create, list by date, patch toggle, delete
- Auth guards on protected endpoints (missing/invalid token)
- MongoDB _id must never leak into responses
"""

import os
import uuid
from datetime import datetime, timezone

import pytest
import requests

BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    # Fallback to frontend/.env by parsing since backend tests need public URL
    from pathlib import Path
    env_path = Path("/app/frontend/.env")
    if env_path.exists():
        for line in env_path.read_text().splitlines():
            if line.startswith("EXPO_PUBLIC_BACKEND_URL="):
                BASE_URL = line.split("=", 1)[1].strip().strip('"').rstrip("/")
                break

API = f"{BASE_URL}/api"


# ---------- Fixtures ----------
@pytest.fixture(scope="session")
def http():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def rand_email():
    return f"TEST_{uuid.uuid4().hex[:10]}@example.com"


@pytest.fixture(scope="session")
def user_a(http, rand_email):
    """Register a fresh user A once for the whole session."""
    r = http.post(f"{API}/auth/register", json={
        "email": rand_email,
        "password": "pass1234",
        "display_name": "TestA",
    })
    assert r.status_code == 200, r.text
    data = r.json()
    return {"token": data["access_token"], "user": data["user"], "password": "pass1234"}


@pytest.fixture(scope="session")
def user_b(http):
    email = f"TEST_{uuid.uuid4().hex[:10]}@example.com"
    r = http.post(f"{API}/auth/register", json={
        "email": email,
        "password": "pass1234",
        "display_name": "TestB",
    })
    assert r.status_code == 200, r.text
    d = r.json()
    return {"token": d["access_token"], "user": d["user"]}


def auth_headers(token):
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}


def _no_mongo_id(obj):
    if isinstance(obj, dict):
        assert "_id" not in obj, f"_id leaked: {obj}"
        for v in obj.values():
            _no_mongo_id(v)
    elif isinstance(obj, list):
        for v in obj:
            _no_mongo_id(v)


# ---------- Health ----------
class TestHealth:
    def test_root(self, http):
        r = http.get(f"{API}/")
        assert r.status_code == 200
        assert r.json().get("message") == "Moodful API"


# ---------- Auth ----------
class TestAuth:
    def test_register_returns_token_and_user(self, user_a):
        assert user_a["token"]
        u = user_a["user"]
        assert u["id"] and u["email"].startswith("test_")  # lowercased
        assert u["display_name"] == "TestA"
        _no_mongo_id(u)

    def test_register_duplicate_email_400(self, http, user_a):
        r = http.post(f"{API}/auth/register", json={
            "email": user_a["user"]["email"],
            "password": "pass1234",
        })
        assert r.status_code == 400

    def test_register_short_password_422(self, http):
        r = http.post(f"{API}/auth/register", json={
            "email": f"TEST_{uuid.uuid4().hex[:8]}@example.com",
            "password": "123",
        })
        assert r.status_code == 422  # pydantic validation min_length=6

    def test_login_success(self, http, user_a):
        r = http.post(f"{API}/auth/login", json={
            "email": user_a["user"]["email"],
            "password": user_a["password"],
        })
        assert r.status_code == 200
        d = r.json()
        assert d["access_token"] and d["token_type"] == "bearer"
        assert d["user"]["email"] == user_a["user"]["email"]
        _no_mongo_id(d)

    def test_login_wrong_password_401(self, http, user_a):
        r = http.post(f"{API}/auth/login", json={
            "email": user_a["user"]["email"],
            "password": "wrongpass",
        })
        assert r.status_code == 401

    def test_login_unknown_email_401(self, http):
        r = http.post(f"{API}/auth/login", json={
            "email": f"nope_{uuid.uuid4().hex[:6]}@example.com",
            "password": "pass1234",
        })
        assert r.status_code == 401

    def test_me_with_token(self, http, user_a):
        r = http.get(f"{API}/auth/me", headers=auth_headers(user_a["token"]))
        assert r.status_code == 200
        d = r.json()
        assert d["id"] == user_a["user"]["id"]
        assert d["email"] == user_a["user"]["email"]
        _no_mongo_id(d)

    def test_me_without_token_401(self, http):
        r = http.get(f"{API}/auth/me")
        # FastAPI HTTPBearer returns 403 by default when missing; 401 if invalid.
        assert r.status_code in (401, 403)

    def test_me_invalid_token_401(self, http):
        r = http.get(f"{API}/auth/me", headers={"Authorization": "Bearer garbage.token.here"})
        assert r.status_code == 401


# ---------- Entries ----------
class TestEntries:
    def _today(self):
        return datetime.now(timezone.utc).strftime("%Y-%m-%d")

    def _month(self):
        return datetime.now(timezone.utc).strftime("%Y-%m")

    def test_create_private_entry(self, http, user_a):
        r = http.post(f"{API}/entries", headers=auth_headers(user_a["token"]), json={
            "emotion": "calm",
            "note": "TEST private note",
            "is_public": False,
            "entry_date": self._today(),
        })
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["id"] and d["hearts"] == 0 and d["hearted_by_me"] is False
        assert d["emotion"] == "calm" and d["is_public"] is False
        assert d["user_id"] == user_a["user"]["id"]
        _no_mongo_id(d)
        pytest.entry_private_id = d["id"]

    def test_create_public_entry(self, http, user_a):
        r = http.post(f"{API}/entries", headers=auth_headers(user_a["token"]), json={
            "emotion": "happy",
            "note": "TEST public note",
            "is_public": True,
            "entry_date": self._today(),
        })
        assert r.status_code == 200
        d = r.json()
        assert d["is_public"] is True and d["hearts"] == 0
        pytest.entry_public_id = d["id"]

    def test_list_my_entries(self, http, user_a):
        r = http.get(f"{API}/entries", headers=auth_headers(user_a["token"]))
        assert r.status_code == 200
        docs = r.json()
        ids = [e["id"] for e in docs]
        assert pytest.entry_private_id in ids
        assert pytest.entry_public_id in ids
        _no_mongo_id(docs)

    def test_calendar_filter(self, http, user_a):
        r = http.get(f"{API}/entries/calendar", headers=auth_headers(user_a["token"]),
                     params={"month": self._month()})
        assert r.status_code == 200
        docs = r.json()
        assert all(e["entry_date"].startswith(self._month()) for e in docs)
        assert pytest.entry_public_id in [e["id"] for e in docs]

    def test_calendar_other_month_empty_or_no_leak(self, http, user_a):
        r = http.get(f"{API}/entries/calendar", headers=auth_headers(user_a["token"]),
                     params={"month": "1999-01"})
        assert r.status_code == 200
        assert r.json() == []

    def test_community_returns_only_public(self, http, user_b):
        # user_b sees user_a's public entry, but not private
        r = http.get(f"{API}/entries/community", headers=auth_headers(user_b["token"]))
        assert r.status_code == 200
        docs = r.json()
        ids = [e["id"] for e in docs]
        assert pytest.entry_public_id in ids
        assert pytest.entry_private_id not in ids
        assert all(e["is_public"] is True for e in docs)

    def test_react_toggle(self, http, user_b):
        eid = pytest.entry_public_id
        # First react → hearts=1, hearted_by_me True
        r1 = http.post(f"{API}/entries/{eid}/react", headers=auth_headers(user_b["token"]))
        assert r1.status_code == 200, r1.text
        d1 = r1.json()
        assert d1["hearts"] == 1 and d1["hearted_by_me"] is True

        # Second react → hearts=0, hearted_by_me False
        r2 = http.post(f"{API}/entries/{eid}/react", headers=auth_headers(user_b["token"]))
        assert r2.status_code == 200
        d2 = r2.json()
        assert d2["hearts"] == 0 and d2["hearted_by_me"] is False

    def test_react_nonexistent_entry_404(self, http, user_a):
        r = http.post(f"{API}/entries/nope-{uuid.uuid4().hex}/react",
                      headers=auth_headers(user_a["token"]))
        assert r.status_code == 404

    def test_entries_require_auth(self, http):
        for path in ["/entries", "/entries/calendar?month=2026-01", "/entries/community"]:
            r = http.get(f"{API}{path}")
            assert r.status_code in (401, 403), f"{path} status={r.status_code}"
        r = http.post(f"{API}/entries", json={"emotion": "x", "entry_date": "2026-01-01"})
        assert r.status_code in (401, 403)


# ---------- Tasks ----------
class TestTasks:
    def _today(self):
        return datetime.now(timezone.utc).strftime("%Y-%m-%d")

    def test_create_task(self, http, user_a):
        r = http.post(f"{API}/tasks", headers=auth_headers(user_a["token"]), json={
            "title": "TEST drink water",
            "task_date": self._today(),
        })
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["id"] and d["completed"] is False and d["title"] == "TEST drink water"
        assert d["user_id"] == user_a["user"]["id"]
        _no_mongo_id(d)
        pytest.task_id = d["id"]

    def test_list_tasks_by_date(self, http, user_a):
        r = http.get(f"{API}/tasks", headers=auth_headers(user_a["token"]),
                     params={"task_date": self._today()})
        assert r.status_code == 200
        docs = r.json()
        ids = [t["id"] for t in docs]
        assert pytest.task_id in ids
        assert all(t["task_date"] == self._today() for t in docs)

    def test_patch_toggle_completed(self, http, user_a):
        r = http.patch(f"{API}/tasks/{pytest.task_id}",
                       headers=auth_headers(user_a["token"]),
                       json={"completed": True})
        assert r.status_code == 200
        assert r.json()["completed"] is True

        # Verify via GET
        r2 = http.get(f"{API}/tasks", headers=auth_headers(user_a["token"]),
                      params={"task_date": self._today()})
        task = next(t for t in r2.json() if t["id"] == pytest.task_id)
        assert task["completed"] is True

    def test_patch_missing_task_404(self, http, user_a):
        r = http.patch(f"{API}/tasks/nope-{uuid.uuid4().hex}",
                       headers=auth_headers(user_a["token"]),
                       json={"completed": True})
        assert r.status_code == 404

    def test_delete_task(self, http, user_a):
        r = http.delete(f"{API}/tasks/{pytest.task_id}",
                        headers=auth_headers(user_a["token"]))
        assert r.status_code == 200
        # Verify gone
        r2 = http.get(f"{API}/tasks", headers=auth_headers(user_a["token"]),
                      params={"task_date": self._today()})
        assert pytest.task_id not in [t["id"] for t in r2.json()]

    def test_delete_missing_task_404(self, http, user_a):
        r = http.delete(f"{API}/tasks/nope-{uuid.uuid4().hex}",
                        headers=auth_headers(user_a["token"]))
        assert r.status_code == 404

    def test_tasks_require_auth(self, http):
        r = http.get(f"{API}/tasks")
        assert r.status_code in (401, 403)
        r = http.post(f"{API}/tasks", json={"title": "x", "task_date": "2026-01-01"})
        assert r.status_code in (401, 403)


# ---------- Cleanup for entries created ----------
class TestZCleanup:
    def test_delete_created_entries(self, http, user_a):
        for attr in ("entry_private_id", "entry_public_id"):
            eid = getattr(pytest, attr, None)
            if eid:
                r = http.delete(f"{API}/entries/{eid}", headers=auth_headers(user_a["token"]))
                assert r.status_code == 200
