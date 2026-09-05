"""Atomic service writes while keeping standalone repositories compatible."""
from functools import wraps
from sqlalchemy.orm import Session

_ATOMIC_WRITE = "vestoria_atomic_write"


def commit_or_flush(db: Session) -> None:
    """Repositories must not commit part of a larger business operation."""
    if db.info.get(_ATOMIC_WRITE):
        db.flush()
    else:
        db.commit()


def atomic(method):
    """Commit once at the outermost service call; roll back on any failure."""
    @wraps(method)
    def wrapped(self, *args, **kwargs):
        db = self.db
        if db.info.get(_ATOMIC_WRITE):
            return method(self, *args, **kwargs)
        db.info[_ATOMIC_WRITE] = True
        try:
            result = method(self, *args, **kwargs)
            db.commit()
            return result
        except Exception:
            db.rollback()
            raise
        finally:
            db.info.pop(_ATOMIC_WRITE, None)
    return wrapped
