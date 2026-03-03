"""FastAPI application entry point."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings
from app.db import engine, Base
from app.api import auth, funds, investors

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
app.include_router(funds.router, prefix=f"{settings.API_V1_PREFIX}/funds", tags=["Funds"])
app.include_router(investors.router, prefix=f"{settings.API_V1_PREFIX}/funds/{{fund_id}}/investors", tags=["Investors"])


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
