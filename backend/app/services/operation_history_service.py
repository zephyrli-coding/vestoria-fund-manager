"""Operation export/import service."""
import json
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models import Operation, Fund, Investor


class OperationHistoryService:
    """Service for exporting and importing operation history."""

    def __init__(self, db: Session):
        self.db = db

    def export_operations(self, fund_id: int) -> List[Dict[str, Any]]:
        """Export operation history for a fund.
        
        Returns list of operations in chronological order.
        Each operation is a dict with operation details.
        """
        # Check fund exists
        fund = self.db.query(Fund).filter(Fund.id == fund_id).first()
        if not fund:
            raise ValueError(f"Fund with id {fund_id} not found")

        # Get all operations ordered by date and id
        operations = self.db.query(Operation).filter(
            Operation.fund_id == fund_id
        ).order_by(Operation.operation_date, Operation.id).all()

        result = []
        for op in operations:
            # Build operation record
            record = {
                "operation_type": op.operation_type,
                "operation_date": op.operation_date,
            }

            # Add investor name if applicable
            if op.investor_id and op.investor:
                record["investor_name"] = op.investor.name

            # Add operation-specific fields
            if op.amount is not None:
                record["amount"] = op.amount
            if op.amount_type:
                record["amount_type"] = op.amount_type
            if op.share is not None:
                record["share"] = op.share
            
            # For update_nav, export nav_after as target_nav
            if op.operation_type == "update_nav" and op.nav_after is not None:
                record["target_nav"] = op.nav_after

            # Add transfer info
            if op.operation_type == "transfer":
                if op.transfer_from:
                    record["from_investor"] = op.transfer_from.name
                if op.transfer_to:
                    record["to_investor"] = op.transfer_to.name

            result.append(record)

        return result

    def export_to_jsonl(self, fund_id: int) -> str:
        """Export operations to JSONL format string.
        
        First line: fund metadata (_type: fund_meta)
        Following lines: operations (_type: operation)
        """
        # Get fund info
        fund = self.db.query(Fund).filter(Fund.id == fund_id).first()
        if not fund:
            raise ValueError(f"Fund with id {fund_id} not found")

        lines = []
        
        # First line: fund metadata
        meta = {
            "_type": "fund_meta",
            "name": fund.name,
            "start_date": fund.start_date,
            "currency": fund.currency
        }
        lines.append(json.dumps(meta, ensure_ascii=False))
        
        # Following lines: operations
        operations = self.db.query(Operation).filter(
            Operation.fund_id == fund_id
        ).order_by(Operation.operation_date, Operation.id).all()

        for op in operations:
            record = {
                "_type": "operation",
                "operation_type": op.operation_type,
                "operation_date": op.operation_date,
            }

            # Add investor name if applicable
            if op.investor_id and op.investor:
                record["investor_name"] = op.investor.name

            # Add operation-specific fields
            if op.amount is not None:
                record["amount"] = op.amount
            if op.amount_type:
                record["amount_type"] = op.amount_type
            if op.share is not None:
                record["share"] = op.share
            
            # For update_nav, export nav_after as target_nav
            if op.operation_type == "update_nav" and op.nav_after is not None:
                record["target_nav"] = op.nav_after

            # Add transfer info
            if op.operation_type == "transfer":
                if op.transfer_from:
                    record["from_investor"] = op.transfer_from.name
                if op.transfer_to:
                    record["to_investor"] = op.transfer_to.name

            lines.append(json.dumps(record, ensure_ascii=False))

        return "\n".join(lines)

    def import_from_jsonl(self, content: str, target_fund_id: int = None) -> Dict[str, Any]:
        """Import operations from JSONL format.
        
        Args:
            content: JSONL string content
            target_fund_id: If provided, import to existing fund (append mode)
                           If None, create new fund from metadata (create mode)
            
        Returns:
            Dict with import results
        """
        from app.services.investor_service import InvestorService
        from app.services.fund_service import FundService

        # Parse JSONL
        lines = []
        for line_num, line in enumerate(content.strip().split("\n"), 1):
            line = line.strip()
            if not line:
                continue
            try:
                data = json.loads(line)
                data["_line_num"] = line_num
                lines.append(data)
            except json.JSONDecodeError as e:
                raise ValueError(f"Invalid JSON at line {line_num}: {e}")

        if not lines:
            raise ValueError("No valid data found in file")

        # First line should be fund metadata
        first_line = lines[0]
        if first_line.get("_type") != "fund_meta":
            raise ValueError("First line must be fund metadata with '_type': 'fund_meta'")

        fund_meta = {
            "name": first_line.get("name"),
            "start_date": first_line.get("start_date"),
            "currency": first_line.get("currency", "CNY")
        }

        if not fund_meta["name"]:
            raise ValueError("Fund name is required in metadata")

        # Determine import mode
        fund_id: int
        is_new_fund: bool
        actual_fund_name: str
        
        if target_fund_id:
            # Append mode: import to existing fund
            fund = self.db.query(Fund).filter(Fund.id == target_fund_id).first()
            if not fund:
                raise ValueError(f"Target fund with id {target_fund_id} not found")
            
            # Check name match (optional validation)
            if fund.name != fund_meta["name"]:
                print(f"Warning: Fund name mismatch. File: '{fund_meta['name']}', Target: '{fund.name}'")
            
            fund_id = target_fund_id
            is_new_fund = False
            actual_fund_name = fund.name
        else:
            # Create mode: create new fund
            # Check if fund exists, if so, generate new name with timestamp
            original_name = fund_meta["name"]
            new_name = original_name
            
            existing = self.db.query(Fund).filter(Fund.name == new_name).first()
            if existing:
                # Generate new name with timestamp
                from datetime import datetime
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                new_name = f"{original_name} (导入于 {timestamp})"
                
                # Check again if new name exists (very unlikely but possible)
                counter = 1
                while self.db.query(Fund).filter(Fund.name == new_name).first():
                    new_name = f"{original_name} (导入于 {timestamp}_{counter})"
                    counter += 1
            
            # Create new fund
            fund = Fund(
                name=new_name,
                start_date=fund_meta["start_date"],
                currency=fund_meta["currency"],
                total_share=0.0,
                net_asset_value=1.0,
                balance=0.0
            )
            self.db.add(fund)
            self.db.flush()
            fund_id = fund.id
            is_new_fund = True
            actual_fund_name = new_name

        # Initialize services
        investor_service = InvestorService(self.db)
        fund_service = FundService(self.db)

        # Track results
        results = {
            "fund_id": fund_id,
            "fund_name": actual_fund_name,
            "is_new_fund": is_new_fund,
            "total_operations": len(lines) - 1,  # Exclude metadata line
            "success": 0,
            "failed": 0,
            "errors": []
        }

        # Cache for investor name -> id mapping
        investor_map: Dict[str, int] = {}
        
        # Pre-load existing investors
        existing_investors = self.db.query(Investor).filter(Investor.fund_id == fund_id).all()
        for inv in existing_investors:
            investor_map[inv.name] = inv.id

        # Process operations (skip first line - metadata)
        for data in lines[1:]:
            line_num = data.pop("_line_num", 0)
            
            # Skip non-operation lines
            if data.get("_type") != "operation":
                continue
            
            try:
                self._execute_operation(
                    fund_id=fund_id,
                    op=data,
                    investor_service=investor_service,
                    fund_service=fund_service,
                    investor_map=investor_map
                )
                results["success"] += 1
            except Exception as e:
                results["failed"] += 1
                results["errors"].append(f"Line {line_num}: {str(e)}")
                # Continue with next operation

        return results

    def _execute_operation(
        self,
        fund_id: int,
        op: Dict[str, Any],
        investor_service,
        fund_service,
        investor_map: Dict[str, int]
    ):
        """Execute a single operation."""
        op_type = op.get("operation_type")
        if not op_type:
            raise ValueError("operation_type is required")

        op_date = op.get("operation_date")
        if not op_date:
            raise ValueError("operation_date is required")

        if op_type == "add_investor":
            name = op.get("investor_name")
            if not name:
                raise ValueError("investor_name is required for add_investor")
            
            # Check if investor already exists
            if name in investor_map:
                # Investor already exists, skip
                return
            
            result = investor_service.add_investor(fund_id, name, op_date)
            investor_map[name] = result.id

        elif op_type == "invest":
            name = op.get("investor_name")
            amount = op.get("amount")
            if not name or amount is None:
                raise ValueError("investor_name and amount are required for invest")
            
            investor_id = investor_map.get(name)
            if not investor_id:
                # Auto-create investor if not exists
                result = investor_service.add_investor(fund_id, name, op_date)
                investor_id = result.id
                investor_map[name] = investor_id
            
            investor_service.invest(fund_id, investor_id, amount, op_date)

        elif op_type == "redeem":
            name = op.get("investor_name")
            amount = op.get("amount")
            amount_type = op.get("amount_type", "share")
            if not name or amount is None:
                raise ValueError("investor_name and amount are required for redeem")
            
            investor_id = investor_map.get(name)
            if not investor_id:
                raise ValueError(f"Investor '{name}' not found")
            
            investor_service.redeem(fund_id, investor_id, amount, amount_type, op_date)

        elif op_type == "transfer":
            from_name = op.get("from_investor")
            to_name = op.get("to_investor")
            amount = op.get("amount")
            amount_type = op.get("amount_type", "share")
            
            if not from_name or not to_name or amount is None:
                raise ValueError("from_investor, to_investor and amount are required for transfer")
            
            from_id = investor_map.get(from_name)
            to_id = investor_map.get(to_name)
            
            if not from_id:
                raise ValueError(f"Investor '{from_name}' not found")
            if not to_id:
                # Auto-create target investor
                result = investor_service.add_investor(fund_id, to_name, op_date)
                to_id = result.id
                investor_map[to_name] = to_id
            
            investor_service.transfer(fund_id, from_id, to_id, amount, amount_type, op_date)

        elif op_type == "update_nav":
            # Try target_nav first (from export), then amount (for backward compatibility)
            target_nav = op.get("target_nav")
            capital = op.get("amount")
            
            if target_nav is not None:
                # Use target_nav directly - calculate capital from target_nav and current total_share
                fund = self.db.query(Fund).filter(Fund.id == fund_id).first()
                if fund and fund.total_share > 0:
                    calculated_capital = target_nav * fund.total_share
                    fund_service.update_nav(fund_id, calculated_capital, op_date)
                else:
                    # If no shares yet, just set NAV directly
                    fund.net_asset_value = target_nav
                    fund.balance = fund.total_share * target_nav
                    self.db.commit()
            elif capital is not None:
                fund_service.update_nav(fund_id, capital, op_date)
            else:
                raise ValueError("target_nav or amount is required for update_nav")

        else:
            raise ValueError(f"Unknown operation type: {op_type}")
