"""Validation shared by API calls and imported operations."""
from datetime import date
from math import isfinite


def positive_number(value, field: str) -> None:
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise ValueError(f"{field} must be a finite number greater than 0")
    if not isfinite(value) or value <= 0:
        raise ValueError(f"{field} must be a finite number greater than 0")


def rounded(value: float) -> float:
    if not isfinite(value):
        raise ValueError("Calculated value is outside the supported numeric range")
    return round(value, 6)


def validate_day(value, field: str = "Operation date") -> None:
    if not isinstance(value, str) or len(value) != 10:
        raise ValueError(f"{field} must use YYYY-MM-DD")
    try:
        parsed = date.fromisoformat(value)
    except ValueError as error:
        raise ValueError(f"{field} must be a valid YYYY-MM-DD date") from error
    if parsed.isoformat() != value:
        raise ValueError(f"{field} must use YYYY-MM-DD")


def validate_name(value, field: str) -> None:
    if not isinstance(value, str) or not value.strip() or len(value) > 100:
        raise ValueError(f"{field} must contain 1 to 100 characters")


def validate_currency(value) -> None:
    if value not in ("CNY", "USD"):
        raise ValueError("Currency must be CNY or USD")


def validate_amount_type(value) -> None:
    if value not in ("share", "balance"):
        raise ValueError("Amount type must be share or balance")
