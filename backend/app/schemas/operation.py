"""Operation schemas."""
from typing import List, Optional, Literal
from pydantic import BaseModel, Field
from datetime import datetime


class OperationResponse(BaseModel):
    """Operation response."""

    id: int = Field(..., description="Operation ID")
    fund_id: int = Field(..., description="Fund ID")
    investor_id: Optional[int] = Field(default=None, description="Investor ID")
    operation_type: str = Field(..., description="Operation type")
    operation_date: str = Field(..., description="Operation date")
    amount: Optional[float] = Field(default=None, description="Operation amount")
    amount_type: Optional[str] = Field(default=None, description="Amount type (share/balance)")
    share: Optional[float] = Field(default=None, description="Shares involved")
    nav_before: Optional[float] = Field(default=None, description="NAV before operation")
    nav_after: Optional[float] = Field(default=None, description="NAV after operation")
    total_share_before: Optional[float] = Field(default=None, description="Total shares before")
    total_share_after: Optional[float] = Field(default=None, description="Total shares after")
    balance_before: Optional[float] = Field(default=None, description="Balance before")
    balance_after: Optional[float] = Field(default=None, description="Balance after")
    transfer_from_id: Optional[int] = Field(default=None, description="Transfer from investor ID")
    transfer_to_id: Optional[int] = Field(default=None, description="Transfer to investor ID")
    created_at: datetime = Field(..., description="Record creation time")

    class Config:
        from_attributes = True


class OperationListResponse(BaseModel):
    """List of operations with pagination."""

    items: List[OperationResponse] = Field(default_factory=list)
    total: int = Field(default=0)
    page: int = Field(default=1)
    page_size: int = Field(default=50)


class InvestRequest(BaseModel):
    """Investment request."""

    amount: float = Field(..., gt=0, description="Investment amount")
    date: str = Field(default=None, description="Investment date (YYYY-MM-DD)")


class InvestResponse(BaseModel):
    """Investment response."""

    investor_id: int = Field(..., description="Investor ID")
    fund_id: int = Field(..., description="Fund ID")
    investor_name: str = Field(..., description="Investor name")
    invested_amount: float = Field(..., description="Invested amount")
    new_share: float = Field(..., description="New share count")
    fund_total_share: float = Field(..., description="Fund total shares")
    fund_nav: float = Field(..., description="Fund NAV")


class RedeemRequest(BaseModel):
    """Redemption request."""

    amount: float = Field(..., gt=0, description="Redemption amount")
    amount_type: Literal["share", "balance"] = Field(default="balance", description="Amount type")
    date: str = Field(default=None, description="Redemption date (YYYY-MM-DD)")


class RedeemResponse(BaseModel):
    """Redemption response."""

    investor_id: int = Field(..., description="Investor ID")
    fund_id: int = Field(..., description="Fund ID")
    investor_name: str = Field(..., description="Investor name")
    redeemed_share: float = Field(..., description="Redeemed shares")
    redeemed_balance: float = Field(..., description="Redeemed balance")
    new_share: float = Field(..., description="New share count")
    fund_total_share: float = Field(..., description="Fund total shares")
    fund_nav: float = Field(..., description="Fund NAV")


class TransferRequest(BaseModel):
    """Transfer request."""

    from_investor_id: int = Field(..., description="Source investor ID")
    to_investor_id: int = Field(..., description="Target investor ID")
    amount: float = Field(..., gt=0, description="Transfer amount")
    amount_type: Literal["share", "balance"] = Field(default="balance", description="Amount type")
    date: str = Field(default=None, description="Transfer date (YYYY-MM-DD)")


class TransferResponse(BaseModel):
    """Transfer response."""

    fund_id: int = Field(..., description="Fund ID")
    from_investor_id: int = Field(..., description="Source investor ID")
    from_investor_name: str = Field(..., description="Source investor name")
    to_investor_id: int = Field(..., description="Target investor ID")
    to_investor_name: str = Field(..., description="Target investor name")
    transferred_share: float = Field(..., description="Transferred shares")
    transferred_balance: float = Field(..., description="Transferred balance")
    from_new_share: float = Field(..., description="Source new shares")
    to_new_share: float = Field(..., description="Target new shares")
