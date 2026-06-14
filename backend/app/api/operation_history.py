"""Operation history import/export API."""
import base64
import io
import zipfile
from fastapi import APIRouter, Depends, HTTPException, status, Response, Body
from sqlalchemy.orm import Session
from typing import Optional, List

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
    body: dict = Body(...),
    service: OperationHistoryService = Depends(get_history_service)
):
    """Import operations and create new fund(s).

    Supports two modes:
    1. Single JSONL: body = { "content": "jsonl text..." }
    2. ZIP archive:  body = { "content": "base64 zip...", "is_zip": true }

    For ZIP: each .jsonl file inside becomes a new fund.
    """
    content = body.get("content", "")
    is_zip = body.get("is_zip", False)

    if not content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="content is required"
        )

    try:
        if is_zip:
            # Decode base64 ZIP data
            try:
                zip_bytes = base64.b64decode(content)
            except Exception:
                raise ValueError("Invalid base64 ZIP data")

            zip_buffer = io.BytesIO(zip_bytes)

            # Validate it's a ZIP file
            if not zipfile.is_zipfile(zip_buffer):
                raise ValueError("Uploaded file is not a valid ZIP archive")

            results = []
            total_success = 0
            total_failed = 0
            total_ops = 0

            with zipfile.ZipFile(zip_buffer, 'r') as zf:
                jsonl_files = [name for name in zf.namelist() if name.endswith('.jsonl')]

                if not jsonl_files:
                    raise ValueError("No .jsonl files found in ZIP archive")

                for filename in sorted(jsonl_files):
                    file_content = zf.read(filename).decode('utf-8')
                    try:
                        result = service.import_from_jsonl(file_content, target_fund_id=None)
                        results.append({
                            "filename": filename,
                            "status": "success",
                            **result
                        })
                        total_success += result.get("success", 0)
                        total_failed += result.get("failed", 0)
                        total_ops += result.get("total_operations", 0)
                    except ValueError as e:
                        results.append({
                            "filename": filename,
                            "status": "error",
                            "error": str(e)
                        })

            return ResponseModel(data={
                "is_zip": True,
                "imported_funds": len([r for r in results if r.get("status") == "success"]),
                "total_operations": total_ops,
                "success": total_success,
                "failed": total_failed,
                "funds": results
            })
        else:
            # Single JSONL import (original behavior)
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
