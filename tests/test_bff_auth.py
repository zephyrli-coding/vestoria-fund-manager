import pytest
import os
from unittest.mock import patch
from uuid import uuid4

os.environ["AUTH_CLIENT_SECRET"] = "test-secret"
os.environ["FRONTEND_URL"] = "http://localhost:20260"
os.environ["SESSION_COOKIE_SECURE"] = "false"

from fastapi import Depends, FastAPI, HTTPException
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.api.auth import get_current_admin, router
from app.db import Base, get_db

engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSession = sessionmaker(bind=engine)
Base.metadata.create_all(bind=engine)


def override_db():
    db = TestingSession()
    try:
        yield db
    finally:
        db.close()


app = FastAPI()
app.dependency_overrides[get_db] = override_db
app.include_router(router, prefix="/api/v1/auth")


@app.get("/api/v1/resource", dependencies=[Depends(get_current_admin)])
def read_resource():
    return {"ok": True}


@app.post("/api/v1/resource", dependencies=[Depends(get_current_admin)])
def write_resource():
    return {"ok": True}


client = TestClient(app)


@pytest.fixture(autouse=True)
def bff_configuration(monkeypatch):
    monkeypatch.setattr("app.api.auth.AUTH_CLIENT_SECRET", "test-secret")
    monkeypatch.setattr("app.api.auth.FRONTEND_URL", "http://localhost:20260")
    monkeypatch.setattr("app.session.FRONTEND_URL", "http://localhost:20260")
    monkeypatch.setattr("app.session.COOKIE_SECURE", False)
    client.cookies.clear()
    yield
    client.cookies.clear()


def userinfo(user_id: str, *, verified=True, roles=None):
    return {
        "sub": user_id,
        "email": f"{user_id}@example.com",
        "nickname": "Fund User",
        "email_verified": verified,
        "roles": roles or [],
        "is_superuser": False,
    }


def callback(payload: dict):
    with patch("app.api.auth.httpx.post") as token_post, patch(
        "app.api.auth.httpx.get"
    ) as info_get, patch(
        "app.api.auth.session_store.create", return_value=("fund-session", "fund-csrf")
    ) as created:
        token_post.return_value.status_code = 200
        token_post.return_value.json.return_value = {
            "access_token": "access",
            "refresh_token": "refresh",
        }
        info_get.return_value.status_code = 200
        info_get.return_value.json.return_value = payload
        response = client.post("/api/v1/auth/callback", params={"code": "code"})
        if response.status_code == 200:
            session_cookie = response.cookies.get("vestoria_fund_session")
            csrf_cookie = response.cookies.get("vestoria_fund_csrf")
            client.cookies.clear()
            client.cookies.set("vestoria_fund_session", session_cookie, path="/")
            client.cookies.set("vestoria_fund_csrf", csrf_cookie, path="/")
        if response.status_code != 200:
            created.assert_not_called()
            assert "set-cookie" not in response.headers
        return response


def test_callback_sets_cookie_without_exposing_tokens():
    response = callback(userinfo(str(uuid4()), roles=["vestoria:viewer"]))
    assert response.status_code == 200
    body = response.json()
    assert body["data"]["user"]["role"] == "viewer"
    assert "access_token" not in str(body)
    assert response.cookies.get("vestoria_fund_session") == "fund-session"


def test_callback_accepts_unverified_authorized_but_rejects_unassigned_users():
    assert callback(userinfo(str(uuid4()), verified=False, roles=["vestoria:viewer"])).status_code == 200
    assert callback(userinfo(str(uuid4()), roles=[])).status_code == 403


def test_viewer_can_read_but_cannot_write():
    user_id = str(uuid4())
    callback(userinfo(user_id, roles=["vestoria:viewer"]))
    session = {"access_token": "access", "refresh_token": "refresh", "csrf_token": "fund-csrf"}
    with patch("app.api.auth.session_store.get", return_value=session), patch(
        "app.api.auth.decode_auth_token", return_value={"sub": user_id}
    ), patch("app.api.auth.httpx.get") as info_get:
        info_get.return_value.status_code = 200
        info_get.return_value.json.return_value = userinfo(user_id, roles=["vestoria:viewer"])
        response = client.get("/api/v1/resource")
        assert response.status_code == 200, response.text
        assert client.post(
            "/api/v1/resource", headers={"X-CSRF-Token": "fund-csrf"}
        ).status_code == 403


def test_editor_write_requires_csrf():
    user_id = str(uuid4())
    callback(userinfo(user_id, roles=["vestoria:editor"]))
    session = {"access_token": "access", "refresh_token": "refresh", "csrf_token": "fund-csrf"}
    with patch("app.api.auth.session_store.get", return_value=session), patch(
        "app.api.auth.decode_auth_token", return_value={"sub": user_id}
    ), patch("app.api.auth.httpx.get") as info_get:
        info_get.return_value.status_code = 200
        info_get.return_value.json.return_value = userinfo(user_id, roles=["vestoria:editor"])
        assert client.post("/api/v1/resource").status_code == 403
        assert client.post(
            "/api/v1/resource", headers={"X-CSRF-Token": "fund-csrf"}
        ).status_code == 200


def test_display_name_tracks_auth_without_changing_local_identity():
    payload = userinfo(str(uuid4()), roles=["vestoria:viewer"])
    payload["email"] = f"{uuid4().hex}@example.com"
    original = callback(payload).json()["data"]["user"]
    assert original["display_name"] == payload["nickname"]
    session = {"access_token": "access", "refresh_token": "refresh", "csrf_token": "fund-csrf"}
    with patch("app.api.auth.session_store.get", return_value=session), patch(
        "app.api.auth.decode_auth_token", return_value={"sub": payload["sub"]}
    ), patch("app.api.auth.httpx.get") as info_get:
        info_get.return_value.status_code = 200
        for nickname, expected in [("新昵称", "新昵称"), ("  ", payload["email"].split("@")[0]), (None, payload["email"].split("@")[0])]:
            payload["nickname"] = nickname
            info_get.return_value.json.return_value = payload
            response = client.get("/api/v1/auth/me")
            assert response.status_code == 200, response.text
            current = response.json()["data"]
            assert current["display_name"] == expected
            assert (current["id"], current["username"]) == (original["id"], original["username"])


@pytest.mark.parametrize("verified", [False, True])
@pytest.mark.parametrize("roles,can_read,can_write", [
    (["vestoria:viewer"], True, False), (["vestoria:editor"], True, True),
    (["auth-service:admin"], True, True), ([], False, False),
    (["unrelated:editor"], False, False),
])
def test_email_independent_live_permission_matrix(verified, roles, can_read, can_write):
    payload = userinfo(str(uuid4()), verified=verified, roles=roles)
    response = callback(payload)
    assert response.status_code == (200 if can_read else 403)
    if not can_read:
        return
    session = {"access_token": "access", "refresh_token": "refresh", "csrf_token": "fund-csrf"}
    with patch("app.api.auth.session_store.get", return_value=session), patch(
        "app.api.auth.decode_auth_token", return_value={"sub": payload["sub"]}
    ), patch("app.api.auth.httpx.get") as info:
        info.return_value.status_code = 200
        info.return_value.json.return_value = payload
        assert client.get("/api/v1/resource").status_code == 200
        assert client.post("/api/v1/resource").status_code == 403
        assert client.post("/api/v1/resource", headers={"X-CSRF-Token":"fund-csrf"}).status_code == (200 if can_write else 403)
        payload["roles"] = []
        assert client.get("/api/v1/resource").status_code == 403
        info.return_value.status_code = 401
        with patch("app.api.auth._refresh_session", side_effect=HTTPException(401, "revoked")):
            assert client.get("/api/v1/resource").status_code == 401


def _seed_mapping(email, subject=None, active=True):
    from app.models.admin import Admin
    with TestingSession() as db:
        admin = Admin(username="mapping-"+uuid4().hex, email=email, auth_user_id=subject, is_active=active)
        db.add(admin); db.commit(); db.refresh(admin)
        return admin.id


@pytest.mark.parametrize("verified", [False, True])
def test_same_subject_does_not_require_email_verification(verified):
    payload = userinfo(str(uuid4()), verified=verified, roles=["vestoria:viewer"])
    existing = _seed_mapping(payload["email"], payload["sub"])
    assert callback(payload).status_code == 200
    from app.models.admin import Admin
    with TestingSession() as db:
        assert db.query(Admin).filter_by(auth_user_id=payload["sub"]).one().id == existing


@pytest.mark.parametrize("verified", [False, True])
@pytest.mark.parametrize("bound", [False, True])
def test_email_collision_never_rebinds_another_subject(verified, bound):
    from app.models.admin import Admin
    payload = userinfo(str(uuid4()), verified=verified, roles=["vestoria:editor"])
    old_subject = str(uuid4()) if bound else None
    existing = _seed_mapping(payload["email"], old_subject)
    response = callback(payload)
    allowed = verified and not bound
    assert response.status_code == (200 if allowed else 409)
    with TestingSession() as db:
        admin = db.get(Admin, existing)
        assert admin.auth_user_id == (payload["sub"] if allowed else old_subject)
        assert admin.email == payload["email"] and admin.is_active
        assert db.query(Admin).filter_by(email=payload["email"]).count() == 1


@pytest.mark.parametrize("verified", [False, True])
def test_disabled_local_mapping_cannot_establish_session(verified):
    payload = userinfo(str(uuid4()), verified=verified, roles=["vestoria:editor"])
    _seed_mapping(payload["email"], payload["sub"], active=False)
    assert callback(payload).status_code == 401


def test_existing_subject_email_collision_rolls_back():
    from app.models.admin import Admin
    payload = userinfo(str(uuid4()), verified=False, roles=["vestoria:editor"])
    old_email = payload["email"]
    existing = _seed_mapping(old_email, payload["sub"])
    other_email = uuid4().hex+"@example.com"
    other_subject = str(uuid4())
    other = _seed_mapping(other_email, other_subject)
    payload["email"] = other_email
    assert callback(payload).status_code == 409
    with TestingSession() as db:
        assert db.get(Admin, existing).email == old_email
        assert db.get(Admin, existing).auth_user_id == payload["sub"]
        assert db.get(Admin, other).auth_user_id == other_subject


def test_legacy_claim_loses_race_without_rebinding():
    from sqlalchemy.orm import Query
    from app.models.admin import Admin
    payload = userinfo(str(uuid4()), verified=True, roles=["vestoria:viewer"])
    existing = _seed_mapping(payload["email"])
    with patch.object(Query, "update", return_value=0):
        assert callback(payload).status_code == 409
    with TestingSession() as db:
        assert db.get(Admin, existing).auth_user_id is None
