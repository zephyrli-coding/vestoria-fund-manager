"""Operation repository for database operations."""
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.models.operation import Operation


class OperationRepository:
    """Repository for Operation model."""

    def __init__(self, db: Session):
        self.db = db

    def create(self, **kwargs) -> Operation:
        """Create a new operation record."""
        operation = Operation(**kwargs)
        self.db.add(operation)
        self.db.commit()
        self.db.refresh(operation)
        return operation

    def get_by_id(self, operation_id: int) -> Optional[Operation]:
        """Get operation by ID."""
        return self.db.query(Operation).filter(Operation.id == operation_id).first()

    def get_by_fund(
        self,
        fund_id: int,
        operation_type: Optional[str] = None,
        investor_id: Optional[int] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        skip: int = 0,
        limit: int = 50
    ) -> List[Operation]:
        """Get operations by fund with filters."""
        query = self.db.query(Operation).filter(Operation.fund_id == fund_id)

        if operation_type:
            query = query.filter(Operation.operation_type == operation_type)
        if investor_id:
            query = query.filter(Operation.investor_id == investor_id)
        if start_date:
            query = query.filter(Operation.operation_date >= start_date)
        if end_date:
            query = query.filter(Operation.operation_date <= end_date)

        return query.order_by(desc(Operation.id)).offset(skip).limit(limit).all()

    def count_by_fund(
        self,
        fund_id: int,
        operation_type: Optional[str] = None,
        investor_id: Optional[int] = None
    ) -> int:
        """Count operations by fund with filters."""
        query = self.db.query(Operation).filter(Operation.fund_id == fund_id)

        if operation_type:
            query = query.filter(Operation.operation_type == operation_type)
        if investor_id:
            query = query.filter(Operation.investor_id == investor_id)

        return query.count()
