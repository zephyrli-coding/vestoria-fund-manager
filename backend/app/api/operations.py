"""Global operations API routes."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db import get_db
from app.schemas.common import ResponseModel
from app.schemas.operation import OperationListResponse, OperationResponse
from app.repositories.operation_repo import OperationRepository

router = APIRouter()


@router.get("/recent", response_model=ResponseModel[OperationListResponse])
def get_recent_operations(
    limit: int = 10,
    db: Session = Depends(get_db)
):
    """Get recent operations across all funds."""
    repo = OperationRepository(db)
    operations = repo.get_recent(limit=limit)
    return ResponseModel(data={
        "items": operations,
        "total": len(operations),
        "page": 1,
        "page_size": limit
    })
