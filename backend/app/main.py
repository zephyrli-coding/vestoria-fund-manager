"""FastAPI application entry point."""
from urllib.parse import urlsplit

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings
from app.db import engine, Base
# Import models to register them with Base.metadata
import app.models
from app.api import auth, funds, investors, operation_history, operations
from app.api.auth import get_current_admin

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
    allow_origins=[
        f"{urlsplit(settings.FRONTEND_URL).scheme}://{urlsplit(settings.FRONTEND_URL).netloc}"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix=f"{settings.API_V1_PREFIX}/auth", tags=["Authentication"])
protected = [Depends(get_current_admin)]
app.include_router(operation_history.router, prefix=f"{settings.API_V1_PREFIX}", tags=["Operation History"], dependencies=protected)
app.include_router(funds.router, prefix=f"{settings.API_V1_PREFIX}/funds", tags=["Funds"], dependencies=protected)
app.include_router(investors.router, prefix=f"{settings.API_V1_PREFIX}/funds/{{fund_id}}/investors", tags=["Investors"], dependencies=protected)
app.include_router(operations.router, prefix=f"{settings.API_V1_PREFIX}/operations", tags=["Operations"], dependencies=protected)


@app.on_event("startup")
def startup_event():
    """Create database tables on startup."""
    Base.metadata.create_all(bind=engine)


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
