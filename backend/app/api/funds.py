"""Fund management API routes."""
import io
import zipfile
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query, Body
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import Optional, List
from app.db import get_db
from app.schemas.common import ResponseModel, ErrorResponse, PaginatedResponse
from app.schemas.fund import (
    FundCreate, FundUpdate, FundResponse, FundListResponse,
    FundHistoryListResponse, FundChartResponse,
    UpdateNavRequest, UpdateNavResponse
)
from app.services.fund_service import FundService
from app.services.operation_history_service import OperationHistoryService
from app.api.auth import get_current_admin
from app.models.admin import Admin

router = APIRouter()


def get_fund_service(db: Session = Depends(get_db)) -> FundService:
    """Get fund service instance."""
    return FundService(db)


@router.post("/export", response_class=StreamingResponse)
def export_funds(
    body: dict = Body(default={}),
    tag: Optional[str] = Query(None, description="Filter by tag before export"),
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    """Export funds to ZIP containing JSONL files.

    If fund_ids is provided, export only those funds.
    If tag is provided, export funds with that tag.
    If neither provided, export all funds.
    """
    from app.models import Fund

    # Get fund_ids from request body if provided
    fund_ids = body.get("fund_ids") if body else None

    # Query funds to export
    query = db.query(Fund)

    if fund_ids:
        query = query.filter(Fund.id.in_(fund_ids))

    if tag:
        query = query.filter(Fund.tags.contains(tag))

    funds = query.all()

    if not funds:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No funds found to export"
        )

    # Create ZIP in memory
    zip_buffer = io.BytesIO()
    history_service = OperationHistoryService(db)

    with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
        for fund in funds:
            # Export each fund as JSONL
            jsonl_content = history_service.export_to_jsonl(fund.id)

            # Sanitize filename
            safe_name = "".join(c for c in fund.name if c.isalnum() or c in (' ', '-', '_')).strip()
            safe_name = safe_name.replace(' ', '_')
            filename = f"{fund.id}_{safe_name}.jsonl"

            zip_file.writestr(filename, jsonl_content)

    zip_buffer.seek(0)

    # Generate timestamp for filename
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

    return StreamingResponse(
        zip_buffer,
        media_type="application/zip",
        headers={
            "Content-Disposition": f"attachment; filename=funds_export_{timestamp}.zip"
        }
    )


@router.get("", response_model=ResponseModel[FundListResponse])
def list_funds(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    tag: str = Query(None, description="Filter by tag"),
    service: FundService = Depends(get_fund_service)
):
    """Get all funds with optional tag filter."""
    skip = (page - 1) * page_size
    result = service.list_funds(skip=skip, limit=page_size, tag=tag)
    return ResponseModel(data=result)


@router.post("", response_model=ResponseModel[FundResponse], status_code=status.HTTP_201_CREATED)
def create_fund(
    request: FundCreate,
    service: FundService = Depends(get_fund_service),
    current_admin: Admin = Depends(get_current_admin)
):
    """Create a new fund."""
    try:
        fund = service.create_fund(request.name, request.start_date, request.currency, request.tags)
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
        fund = service.update_fund(fund_id, request.name, request.currency, request.tags)
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


