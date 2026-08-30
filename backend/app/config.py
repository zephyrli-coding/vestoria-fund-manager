"""Application configuration."""
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings."""

    # Database
    DATABASE_URL: str = "sqlite:///./data/fund_manager.db"

    # JWT (legacy, kept for compatibility; auth-service now issues tokens)
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_DAYS: int = 7

    # Auth-service (OAuth2 + JWKS)
    AUTH_SERVICE_URL: str = "http://localhost:20263"
    AUTH_SERVICE_JWKS_URL: str = "http://localhost:20263/.well-known/jwks.json"
    AUTH_SERVICE_ISSUER: str = "http://localhost:20263"
    AUTH_CLIENT_ID: str = "vestoria"
    AUTH_CLIENT_SECRET: str = ""
    FRONTEND_URL: str = "http://localhost:20260"

    # API
    API_V1_PREFIX: str = "/api/v1"

    # Project root
    PROJECT_ROOT: str = ""

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
