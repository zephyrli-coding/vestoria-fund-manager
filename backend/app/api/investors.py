"""Investor management API routes."""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional
from app.db import get_db
from app.schemas.common import ResponseModel
from app.schemas.investor import (
    InvestorCreate, InvestorUpdate, InvestorResponse, InvestorListResponse
)
from app.schemas.operation import (
    OperationListResponse, InvestRequest, InvestResponse,
    RedeemRequest, RedeemResponse, TransferRequest, TransferResponse
)
from app.services.investor_service import InvestorService
from app.api.auth import get_current_admin
from app.models.admin import Admin

router = APIRouter()


def get_investor_service(db: Session = Depends(get_db)) -> InvestorService:
    """Get investor service instance."""
    return InvestorService(db)


# Investor management endpoints

@router.get("", response_model=ResponseModel[InvestorListResponse])
def list_investors(
    fund_id: int,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    service: InvestorService = Depends(get_investor_service)
):
    """Get all investors in a fund."""
    skip = (page - 1) * page_size
    result = service.list_investors(fund_id, skip=skip, limit=page_size)
    return ResponseModel(data=result)


@router.post("", response_model=ResponseModel[InvestorResponse], status_code=status.HTTP_201_CREATED)
def add_investor(
    fund_id: int,
    request: InvestorCreate,
    service: InvestorService = Depends(get_investor_service),
    current_admin: Admin = Depends(get_current_admin)
):
    """Add a new investor to a fund."""
    from datetime import datetime
    date = request.date or datetime.now().strftime('%Y-%m-%d')

    try:
        investor = service.add_investor(fund_id, request.name, date)
        return ResponseModel(data=investor, message="Investor added successfully")
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.get("/{investor_id}", response_model=ResponseModel[InvestorResponse])
def get_investor(
    fund_id: int,
    investor_id: int,
    service: InvestorService = Depends(get_investor_service)
):
    """Get investor details."""
    investor = service.get_investor(fund_id, investor_id)
    if not investor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Investor not found")
    return ResponseModel(data=investor)


@router.put("/{investor_id}", response_model=ResponseModel[InvestorResponse])
def update_investor(
    fund_id: int,
    investor_id: int,
    request: InvestorUpdate,
    service: InvestorService = Depends(get_investor_service),
    current_admin: Admin = Depends(get_current_admin)
):
    """Update investor."""
    try:
        investor = service.update_investor(fund_id, investor_id, request.name)
        return ResponseModel(data=investor, message="Investor updated successfully")
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


# Share operation endpoints

@router.post("/{investor_id}/invest", response_model=ResponseModel[InvestResponse])
def invest(
    fund_id: int,
    investor_id: int,
    request: InvestRequest,
    service: InvestorService = Depends(get_investor_service),
    current_admin: Admin = Depends(get_current_admin)
):
    """Investor invests in the fund."""
    from datetime import datetime
    date = request.date or datetime.now().strftime('%Y-%m-%d')

    try:
        result = service.invest(fund_id, investor_id, request.amount, date)
        return ResponseModel(data=result, message="Investment successful")
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.post("/{investor_id}/redeem", response_model=ResponseModel[RedeemResponse])
def redeem(
    fund_id: int,
    investor_id: int,
    request: RedeemRequest,
    service: InvestorService = Depends(get_investor_service),
    current_admin: Admin = Depends(get_current_admin)
):
    """Investor redeems shares or balance."""
    from datetime import datetime
    date = request.date or datetime.now().strftime('%Y-%m-%d')

    try:
        result = service.redeem(fund_id, investor_id, request.amount, request.amount_type, date)
        return ResponseModel(data=result, message="Redemption successful")
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/transfer", response_model=ResponseModel[TransferResponse])
def transfer(
    fund_id: int,
    request: TransferRequest,
    service: InvestorService = Depends(get_investor_service),
    current_admin: Admin = Depends(get_current_admin)
):
    """Transfer shares between investors."""
    from datetime import datetime
    date = request.date or datetime.now().strftime('%Y-%m-%d')

    try:
        result = service.transfer(
            fund_id,
            request.from_investor_id,
            request.to_investor_id,
            request.amount,
            request.amount_type,
            date
        )
        return ResponseModel(data=result, message="Transfer successful")
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


# Operation history endpoints

@router.get("/operations", response_model=ResponseModel[OperationListResponse])
def get_operations(
    fund_id: int,
    operation_type: Optional[str] = Query(None),
    investor_id: Optional[int] = Query(None),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    service: InvestorService = Depends(get_investor_service)
):
    """Get fund operations."""
    skip = (page - 1) * page_size
    result = service.get_operations(
        fund_id=fund_id,
        investor_id=investor_id,
        operation_type=operation_type,
        start_date=start_date,
        end_date=end_date,
        skip=skip,
        limit=page_size
    )
    return ResponseModel(data=result)


@router.get("/{investor_id}/operations", response_model=ResponseModel[OperationListResponse])
def get_investor_operations(
    fund_id: int,
    investor_id: int,
    operation_type: Optional[str] = Query(None),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    service: InvestorService = Depends(get_investor_service)
):
    """Get operations for a specific investor."""
    skip = (page - 1) * page_size
    result = service.get_operations(
        fund_id=fund_id,
        investor_id=investor_id,
        operation_type=operation_type,
        start_date=start_date,
        end_date=end_date,
        skip=skip,
        limit=page_size
    )
    return ResponseModel(data=result)


def get_investor_operations(
    fund_id: int,
    investor_id: int,
    operation_type: Optional[str] = Query(None),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    service: InvestorService = Depends(get_investor_service)
):
    """Get investor operations."""
    skip = (page - 1) * page_size
    result = service.get_operations(
        fund_id=fund_id,
        investor_id=investor_id,
        operation_type=operation_type,
        start_date=start_date,
        end_date=end_date,
        skip=skip,
        limit=page_size
    )
    return ResponseModel(data=result)
