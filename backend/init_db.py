"""Initialize database with default admin account."""
from sqlalchemy.orm import Session
from app.db import SessionLocal, engine
from app.models import Admin
from app.services.auth_service import AuthService


def init_db():
    """Initialize database with default admin."""
    # Create tables
    from app.db import Base
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        # Check if admin exists
        admin = db.query(Admin).filter(Admin.username == "admin").first()
        if not admin:
            # Create default admin
            admin = Admin(
                username="admin",
                password_hash=AuthService.get_password_hash("[REDACTED_TEST_PASSWORD]")
            )
            db.add(admin)
            db.commit()
            print("✅ Default admin created: username=admin, password=[REDACTED_TEST_PASSWORD]")
        else:
            print("ℹ️  Admin already exists")
    finally:
        db.close()


if __name__ == "__main__":
    init_db()
