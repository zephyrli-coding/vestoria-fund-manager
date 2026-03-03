"""Common schemas."""
from typing import Generic, TypeVar, Optional, List
from pydantic import BaseModel, Field


T = TypeVar("T")


class ResponseModel(BaseModel, Generic[T]):
    """Standard success response."""

    code: int = Field(default=0, description="Response code, 0 for success")
    message: str = Field(default="success", description="Response message")
    data: Optional[T] = Field(default=None, description="Response data")


class ErrorResponse(BaseModel):
    """Standard error response."""

    code: int = Field(..., description="Error code")
    message: str = Field(..., description="Error message")
    data: Optional[None] = Field(default=None, description="Always null for errors")


class PaginatedResponse(BaseModel, Generic[T]):
    """Paginated response wrapper."""

    items: List[T] = Field(default_factory=list, description="List of items")
    total: int = Field(default=0, description="Total number of items")
    page: int = Field(default=1, description="Current page number")
    page_size: int = Field(default=20, description="Items per page")
