"""Initialize database with default admin account."""
import os
import secrets

from sqlalchemy.orm import Session
from app.db import SessionLocal, engine
from app.models import Admin
from app.services.auth_service import AuthService


def init_db():
    """Initialize database with default admin."""
    # Ensure data directory exists
    os.makedirs("data", exist_ok=True)

    # Create tables
    from app.db import Base
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        # Check if admin exists
        admin = db.query(Admin).filter(Admin.username == "admin").first()
        if not admin:
            # Create default admin
            # Prefer explicitly configured password; otherwise generate a secure random one.
            password = os.environ.get("DEFAULT_ADMIN_PASSWORD")
            if not password:
                password = secrets.token_urlsafe(12)
                print("⚠️  DEFAULT_ADMIN_PASSWORD not set, generating a random password.")

            admin = Admin(
                username="admin",
                password_hash=AuthService.get_password_hash(password)
            )
            db.add(admin)
            db.commit()
            print(f"✅ Default admin created: username=admin, password={password}")
            print("   Set DEFAULT_ADMIN_PASSWORD env var to use a fixed password.")
        else:
            print("ℹ️  Admin already exists")
    finally:
        db.close()


if __name__ == "__main__":
    init_db()
