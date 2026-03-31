"""Investor schemas."""
from typing import List, Optional
from pydantic import BaseModel, Field
from datetime import datetime


class InvestorBase(BaseModel):
    """Base investor schema."""

    name: str = Field(..., min_length=1, max_length=100, description="Investor name")


class InvestorCreate(BaseModel):
    """Schema for creating an investor."""

    name: str = Field(..., min_length=1, max_length=100, description="Investor name")
    date: str = Field(default=None, description="Creation date (YYYY-MM-DD)")


class InvestorUpdate(BaseModel):
    """Schema for updating an investor."""

    name: str = Field(..., min_length=1, max_length=100, description="Investor name")


class InvestorResponse(BaseModel):
    """Investor response."""

    id: int = Field(..., description="Investor ID")
    fund_id: int = Field(..., description="Fund ID")
    name: str = Field(..., description="Investor name")
    share: float = Field(..., description="Held shares")
    balance: float = Field(..., description="Held balance")
    total_invested: float = Field(..., description="Total invested amount")
    total_redeemed: float = Field(..., description="Total redeemed amount")
    created_at: datetime = Field(..., description="Creation time")
    creation_date: Optional[datetime] = Field(None, description="Original creation date from operation history")

    class Config:
        from_attributes = True


class InvestorListItem(BaseModel):
    """Investor list item (simplified)."""

    id: int = Field(..., description="Investor ID")
    name: str = Field(..., description="Investor name")
    share: float = Field(..., description="Held shares")
    balance: float = Field(..., description="Held balance")
    total_invested: float = Field(..., description="Total invested amount")
    total_redeemed: float = Field(..., description="Total redeemed amount")
    created_at: datetime = Field(..., description="Creation time")
    creation_date: Optional[datetime] = Field(None, description="Original creation date from operation history")

    class Config:
        from_attributes = True


class InvestorListResponse(BaseModel):
    """List of investors with pagination."""

    items: List[InvestorListItem] = Field(default_factory=list)
    total: int = Field(default=0)
    page: int = Field(default=1)
    page_size: int = Field(default=20)


class InvestorReturnSnapshotResponse(BaseModel):
    """Investor return snapshot response."""

    id: int = Field(..., description="Snapshot ID")
    investor_id: int = Field(..., description="Investor ID")
    fund_id: int = Field(..., description="Fund ID")
    date: str = Field(..., description="Snapshot date (YYYY-MM-DD)")
    nav: float = Field(..., description="Fund NAV on this date")
    share: float = Field(..., description="Investor's shares")
    total_invested: float = Field(..., description="Total invested amount")
    total_redeemed: float = Field(..., description="Total redeemed amount")
    total_return: float = Field(..., description="Total return")
    created_at: datetime = Field(..., description="Snapshot creation time")

    class Config:
        from_attributes = True


class InvestorReturnHistoryResponse(BaseModel):
    """Investor return history response."""

    investor_id: int = Field(..., description="Investor ID")
    investor_name: str = Field(..., description="Investor name")
    share: float = Field(..., description="Current shares")
    total_invested: float = Field(..., description="Total invested amount")
    total_redeemed: float = Field(..., description="Total redeemed amount")
    snapshots: List[InvestorReturnSnapshotResponse] = Field(default_factory=list)

    class Config:
        from_attributes = True
