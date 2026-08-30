"""Authentication schemas."""
from pydantic import BaseModel, Field


class MeResponse(BaseModel):
    """Current user response."""

    id: int = Field(..., description="Admin ID")
    username: str = Field(..., description="Username")
    email: str = Field(..., description="Email")
    created_at: str = Field(..., description="Creation time (ISO 8601)")
    role: str = Field(..., description="Effective Fund role")
    can_edit: bool = Field(..., description="Whether write operations are allowed")


class CallbackResponse(BaseModel):
    """OAuth callback response."""
    user: MeResponse = Field(..., description="Current admin info")
