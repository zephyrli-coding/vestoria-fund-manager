"""FastAPI application entry point."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings
from app.db import engine, Base
# Import models to register them with Base.metadata
import app.models
from app.api import auth, funds, investors, operation_history, operations

settings = get_settings()

# Create FastAPI app
app = FastAPI(
    title="Fund Manager API",
    description="API for fund management system",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix=f"{settings.API_V1_PREFIX}/auth", tags=["Authentication"])
app.include_router(operation_history.router, prefix=f"{settings.API_V1_PREFIX}", tags=["Operation History"])
app.include_router(funds.router, prefix=f"{settings.API_V1_PREFIX}/funds", tags=["Funds"])
app.include_router(investors.router, prefix=f"{settings.API_V1_PREFIX}/funds/{{fund_id}}/investors", tags=["Investors"])
app.include_router(operations.router, prefix=f"{settings.API_V1_PREFIX}/operations", tags=["Operations"])


@app.on_event("startup")
def startup_event():
    """Create database tables and default admin on startup."""
    Base.metadata.create_all(bind=engine)
    
    # Create default admin if not exists
    from app.db import SessionLocal
    from app.models.admin import Admin
    from app.services.auth_service import AuthService
    
    db = SessionLocal()
    try:
        admin = db.query(Admin).filter(Admin.username == "admin").first()
        if not admin:
            admin = Admin(
                username="admin",
                password_hash=AuthService.get_password_hash("admin123")
            )
            db.add(admin)
            db.commit()
            print("✅ Default admin created: username=admin, password=admin123")
    finally:
        db.close()


@app.get("/")
def root():
    """Root endpoint."""
    return {
        "message": "Fund Manager API",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/health")
def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}
