"""Pydantic schemas for API requests and responses."""
from app.schemas.fund import (
    FundCreate, FundUpdate, FundResponse, FundListResponse,
    FundHistoryResponse, FundChartResponse, UpdateNavRequest
)
from app.schemas.investor import (
    InvestorCreate, InvestorUpdate, InvestorResponse, InvestorListResponse
)
from app.schemas.operation import (
    OperationResponse, OperationListResponse,
    InvestRequest, RedeemRequest, TransferRequest
)
from app.schemas.auth import (
    LoginRequest, LoginResponse, MeResponse
)
from app.schemas.common import (
    ResponseModel, ErrorResponse, PaginatedResponse
)

__all__ = [
    # Fund
    "FundCreate", "FundUpdate", "FundResponse", "FundListResponse",
    "FundHistoryResponse", "FundChartResponse", "UpdateNavRequest",
    # Investor
    "InvestorCreate", "InvestorUpdate", "InvestorResponse", "InvestorListResponse",
    # Operation
    "OperationResponse", "OperationListResponse",
    "InvestRequest", "RedeemRequest", "TransferRequest",
    # Auth
    "LoginRequest", "LoginResponse", "MeResponse",
    # Common
    "ResponseModel", "ErrorResponse", "PaginatedResponse",
]
