"""Operation history import/export API."""
from fastapi import APIRouter, Depends, HTTPException, status, Response, Body
from sqlalchemy.orm import Session
from typing import Optional

from app.db import get_db
from app.services.operation_history_service import OperationHistoryService
from app.schemas.common import ResponseModel

router = APIRouter(tags=["Operation History"])


def get_history_service(db: Session = Depends(get_db)):
    return OperationHistoryService(db)


@router.get("/funds/{fund_id}/operations/export", response_class=Response)
def export_operations(
    fund_id: int,
    service: OperationHistoryService = Depends(get_history_service)
):
    """Export operation history as JSONL.
    
    First line: fund metadata (_type: fund_meta)
    Following lines: operations (_type: operation)
    
    Returns a JSONL file where each line is a JSON object.
    """
    try:
        jsonl_content = service.export_to_jsonl(fund_id)
        
        # Set response headers for file download
        filename = f"fund_{fund_id}_operations.jsonl"
        return Response(
            content=jsonl_content,
            media_type="application/jsonl",
            headers={
                "Content-Disposition": f"attachment; filename={filename}"
            }
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Export failed: {str(e)}"
        )


@router.post("/funds/{fund_id}/operations/import", response_model=ResponseModel[dict])
def import_operations_to_fund(
    fund_id: int,
    content: str = Body(..., embed=True),
    service: OperationHistoryService = Depends(get_history_service)
):
    """Import operations to an existing fund (append mode).
    
    Args:
        fund_id: Target fund ID (append to existing)
        content: JSONL string content with fund metadata + operations
    
    Returns:
        Import results with success/failure counts
    """
    try:
        results = service.import_from_jsonl(content, target_fund_id=fund_id)
        return ResponseModel(data=results)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Import failed: {str(e)}"
        )


@router.post("/funds/import", response_model=ResponseModel[dict])
def import_operations_new_fund(
    content: str = Body(..., embed=True),
    service: OperationHistoryService = Depends(get_history_service)
):
    """Import operations and create a new fund.
    
    First line of JSONL must contain fund metadata (_type: fund_meta).
    If fund with same name exists, returns error.
    
    Args:
        content: JSONL string content with fund metadata + operations
    
    Returns:
        Import results including new fund_id
    """
    try:
        results = service.import_from_jsonl(content, target_fund_id=None)
        return ResponseModel(data=results)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Import failed: {str(e)}"
        )
