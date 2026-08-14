import os
from functools import lru_cache
from typing import Optional
from uuid import UUID

import httpx
from jose import JWTError, jwt

AUTH_SERVICE_URL = os.getenv("AUTH_SERVICE_URL", "http://localhost:20263")
AUTH_SERVICE_JWKS_URL = os.getenv(
    "AUTH_SERVICE_JWKS_URL", f"{AUTH_SERVICE_URL}/.well-known/jwks.json"
)
AUTH_SERVICE_ISSUER = os.getenv("AUTH_SERVICE_ISSUER", AUTH_SERVICE_URL)
AUTH_CLIENT_ID = os.getenv("AUTH_CLIENT_ID", "vestoria")


@lru_cache(maxsize=1)
def get_jwks() -> dict:
    resp = httpx.get(AUTH_SERVICE_JWKS_URL, timeout=10.0)
    resp.raise_for_status()
    return resp.json()


def _get_signing_key(token: str) -> dict:
    jwks = get_jwks()
    headers = jwt.get_unverified_header(token)
    kid = headers.get("kid")
    for key in jwks.get("keys", []):
        if key.get("kid") == kid:
            return key
    raise JWTError("Signing key not found")


def decode_auth_token(token: str) -> dict:
    key = _get_signing_key(token)
    return jwt.decode(
        token,
        key,
        algorithms=["RS256"],
        issuer=AUTH_SERVICE_ISSUER,
        audience=AUTH_CLIENT_ID,
    )


def get_auth_user_id(token: str) -> Optional[UUID]:
    try:
        payload = decode_auth_token(token)
        response = httpx.get(
            f"{AUTH_SERVICE_URL}/oauth/userinfo",
            headers={"Authorization": f"Bearer {token}"},
            timeout=10.0,
        )
        if response.status_code != 200:
            return None
        return UUID(payload["sub"])
    except (JWTError, KeyError, ValueError, httpx.HTTPError):
        return None
