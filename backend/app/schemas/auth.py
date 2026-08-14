"""Authentication schemas."""
from pydantic import BaseModel, Field


class MeResponse(BaseModel):
    """Current user response."""

    id: int = Field(..., description="Admin ID")
    username: str = Field(..., description="Username")
    email: str = Field(..., description="Email")
    created_at: str = Field(..., description="Creation time (ISO 8601)")


class CallbackResponse(BaseModel):
    """OAuth callback response."""

    access_token: str = Field(..., description="JWT access token")
    refresh_token: str = Field(default="", description="Refresh token")
    token_type: str = Field(default="bearer", description="Token type")
    expires_in: int = Field(default=1800, description="Token expiration time in seconds")
    user: MeResponse = Field(..., description="Current admin info")
