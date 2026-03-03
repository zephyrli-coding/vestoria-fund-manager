"""Authentication schemas."""
from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    """Login request."""

    username: str = Field(..., description="Username")
    password: str = Field(..., description="Password")


class LoginResponse(BaseModel):
    """Login response."""

    access_token: str = Field(..., description="JWT access token")
    token_type: str = Field(default="bearer", description="Token type")
    expires_in: int = Field(default=604800, description="Token expiration time in seconds")


class MeResponse(BaseModel):
    """Current user response."""

    id: int = Field(..., description="Admin ID")
    username: str = Field(..., description="Username")
    created_at: str = Field(..., description="Creation time (ISO 8601)")
