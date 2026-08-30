import os
from unittest.mock import patch
from uuid import uuid4

os.environ["AUTH_CLIENT_SECRET"] = "test-secret"
os.environ["FRONTEND_URL"] = "http://localhost:20260"
os.environ["SESSION_COOKIE_SECURE"] = "false"

from fastapi import Depends, FastAPI
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


def userinfo(user_id: str, *, verified=True, roles=None):
    return {
        "sub": user_id,
        "email": "fund@example.com",
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
    ):
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
        return response


def test_callback_sets_cookie_without_exposing_tokens():
    response = callback(userinfo(str(uuid4()), roles=["vestoria:viewer"]))
    assert response.status_code == 200
    body = response.json()
    assert body["data"]["user"]["role"] == "viewer"
    assert "access_token" not in str(body)
    assert response.cookies.get("vestoria_fund_session") == "fund-session"


def test_callback_rejects_unverified_and_unassigned_users():
    assert callback(userinfo(str(uuid4()), verified=False, roles=["vestoria:viewer"])).status_code == 403
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
