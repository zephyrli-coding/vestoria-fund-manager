"""Investor schemas."""
from typing import List
from pydantic import BaseModel, Field
from datetime import datetime


class InvestorBase(BaseModel):
    """Base investor schema."""

    name: str = Field(..., min_length=1, max_length=100, description="Investor name")


class InvestorCreate(InvestorBase):
    """Schema for creating an investor."""

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

    class Config:
        from_attributes = True


class InvestorListResponse(BaseModel):
    """List of investors with pagination."""

    items: List[InvestorResponse] = Field(default_factory=list)
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
    total_return: float = Field(..., description="Total return = share * nav + total_redeemed - total_invested")
    created_at: datetime = Field(..., description="Creation time")

    class Config:
        from_attributes = True


class InvestorReturnHistoryResponse(BaseModel):
    """Investor return history with calculated metrics."""

    investor_id: int = Field(..., description="Investor ID")
    name: str = Field(..., description="Investor name")
    snapshots: List[InvestorReturnSnapshotResponse] = Field(default_factory=list, description="Historical snapshots")
