"""Fund management API routes."""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional
from app.db import get_db
from app.schemas.common import ResponseModel, ErrorResponse, PaginatedResponse
from app.schemas.fund import (
    FundCreate, FundUpdate, FundResponse, FundListResponse,
    FundHistoryListResponse, FundChartResponse,
    UpdateNavRequest, UpdateNavResponse
)
from app.services.fund_service import FundService
from app.api.auth import get_current_admin
from app.models.admin import Admin

router = APIRouter()


def get_fund_service(db: Session = Depends(get_db)) -> FundService:
    """Get fund service instance."""
    return FundService(db)


@router.get("", response_model=ResponseModel[FundListResponse])
def list_funds(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    service: FundService = Depends(get_fund_service)
):
    """Get all funds."""
    skip = (page - 1) * page_size
    result = service.list_funds(skip=skip, limit=page_size)
    return ResponseModel(data=result)


@router.post("", response_model=ResponseModel[FundResponse], status_code=status.HTTP_201_CREATED)
def create_fund(
    request: FundCreate,
    service: FundService = Depends(get_fund_service),
    current_admin: Admin = Depends(get_current_admin)
):
    """Create a new fund."""
    try:
        fund = service.create_fund(request.name, request.start_date, request.currency)
        return ResponseModel(data=fund, message="Fund created successfully")
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))


@router.get("/{fund_id}", response_model=ResponseModel[FundResponse])
def get_fund(
    fund_id: int,
    service: FundService = Depends(get_fund_service)
):
    """Get fund details."""
    fund = service.get_fund(fund_id)
    if not fund:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Fund not found")
    return ResponseModel(data=fund)


@router.put("/{fund_id}", response_model=ResponseModel[FundResponse])
def update_fund(
    fund_id: int,
    request: FundUpdate,
    service: FundService = Depends(get_fund_service),
    current_admin: Admin = Depends(get_current_admin)
):
    """Update fund."""
    try:
        fund = service.update_fund(fund_id, request.name, request.currency)
        return ResponseModel(data=fund, message="Fund updated successfully")
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.delete("/{fund_id}", response_model=ResponseModel[None])
def delete_fund(
    fund_id: int,
    service: FundService = Depends(get_fund_service),
    current_admin: Admin = Depends(get_current_admin)
):
    """Delete fund."""
    try:
        service.delete_fund(fund_id)
        return ResponseModel(data=None, message="Fund deleted successfully")
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.post("/{fund_id}/update-nav", response_model=ResponseModel[UpdateNavResponse])
def update_nav(
    fund_id: int,
    request: UpdateNavRequest,
    service: FundService = Depends(get_fund_service),
    current_admin: Admin = Depends(get_current_admin)
):
    """Update fund NAV."""
    from datetime import datetime
    date = request.date or datetime.now().strftime('%Y-%m-%d')
    
    try:
        result = service.update_nav(fund_id, request.capital, date)
        return ResponseModel(data=result, message="NAV updated successfully")
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/{fund_id}/history", response_model=ResponseModel[FundHistoryListResponse])
def get_fund_history(
    fund_id: int,
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    service: FundService = Depends(get_fund_service)
):
    """Get fund history."""
    skip = (page - 1) * page_size
    result = service.get_history(
        fund_id=fund_id,
        start_date=start_date,
        end_date=end_date,
        skip=skip,
        limit=page_size
    )
    return ResponseModel(data=result)


@router.get("/{fund_id}/chart", response_model=ResponseModel[FundChartResponse])
def get_chart_data(
    fund_id: int,
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    service: FundService = Depends(get_fund_service)
):
    """Get fund chart data."""
    result = service.get_chart_data(
        fund_id=fund_id,
        start_date=start_date,
        end_date=end_date
    )
    return ResponseModel(data=result)
