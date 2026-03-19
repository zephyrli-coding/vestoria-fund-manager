"""Fund schemas."""
from typing import List, Optional
from pydantic import BaseModel, Field
from datetime import datetime


class FundBase(BaseModel):
    """Base fund schema."""

    name: str = Field(..., min_length=1, max_length=100, description="Fund name")
    start_date: str = Field(..., description="Start date (YYYY-MM-DD)")


class FundCreate(FundBase):
    """Schema for creating a fund."""

    currency: str = Field(default='CNY', description="Currency (CNY or USD)")
    tags: str = Field(default='', description="Tags for the fund")


class FundUpdate(BaseModel):
    """Schema for updating a fund."""

    name: str = Field(..., min_length=1, max_length=100, description="Fund name")
    start_date: str = Field(..., description="Start date (YYYY-MM-DD)")
    currency: str = Field(default=None, description="Currency (CNY or USD)")
    tags: str = Field(default='', description="Comma-separated tags")


class FundResponse(BaseModel):
    """Fund response."""

    id: int = Field(..., description="Fund ID")
    name: str = Field(..., description="Fund name")
    start_date: str = Field(..., description="Start date")
    currency: str = Field(..., description="Currency (CNY or USD)")
    tags: str = Field(default='', description="Comma-separated tags")
    total_share: float = Field(..., description="Total shares")
    net_asset_value: float = Field(..., description="Net asset value (NAV)")
    balance: float = Field(..., description="Total balance")
    created_at: datetime = Field(..., description="Creation time")
    updated_at: datetime = Field(..., description="Last update time")

    class Config:
        from_attributes = True


class FundListResponse(BaseModel):
    """List of funds with pagination."""

    items: List[FundResponse] = Field(default_factory=list)
    total: int = Field(default=0)
    page: int = Field(default=1)
    page_size: int = Field(default=20)


class FundHistoryResponse(BaseModel):
    """Fund history response."""

    id: int = Field(..., description="History record ID")
    fund_id: int = Field(..., description="Fund ID")
    history_date: str = Field(..., description="History date")
    total_share: float = Field(..., description="Total shares at that date")
    net_asset_value: float = Field(..., description="NAV at that date")
    balance: float = Field(..., description="Balance at that date")
    created_at: datetime = Field(..., description="Record creation time")

    class Config:
        from_attributes = True


class FundHistoryListResponse(BaseModel):
    """List of fund history with pagination."""

    items: List[FundHistoryResponse] = Field(default_factory=list)
    total: int = Field(default=0)
    page: int = Field(default=1)
    page_size: int = Field(default=50)


class FundChartResponse(BaseModel):
    """Fund chart data response."""

    nav: List[dict] = Field(default_factory=list, description="NAV history")
    balance: List[dict] = Field(default_factory=list, description="Balance history")
    share: List[dict] = Field(default_factory=list, description="Share history")


class UpdateNavRequest(BaseModel):
    """Request for updating fund NAV."""

    capital: float = Field(..., gt=0, description="Total capital")
    date: str = Field(default=None, description="Update date (YYYY-MM-DD)")


class UpdateNavResponse(BaseModel):
    """Response for NAV update."""

    fund_id: int = Field(..., description="Fund ID")
    old_nav: float = Field(..., description="Old NAV")
    new_nav: float = Field(..., description="New NAV")
    old_balance: float = Field(..., description="Old balance")
    new_balance: float = Field(..., description="New balance")
    total_share: float = Field(..., description="Total shares")
