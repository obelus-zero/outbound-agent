from pydantic_settings import BaseSettings
from typing import Optional
import os


class Settings(BaseSettings):
    # App
    APP_NAME: str = "Outbound Sales Agent"
    DEBUG: bool = True
    SECRET_KEY: str = "your-secret-key-change-in-production"

    # Database
    DATABASE_URL: str = "sqlite:///./outbound_agent.db"

    # JWT
    JWT_SECRET_KEY: str = "jwt-secret-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # Claude AI
    ANTHROPIC_API_KEY: Optional[str] = None
    CLAUDE_MODEL: str = "claude-sonnet-4-20250514"

    # Prospect.io
    PROSPECT_IO_API_KEY: Optional[str] = None

    # Salesforce
    SALESFORCE_CLIENT_ID: Optional[str] = None
    SALESFORCE_CLIENT_SECRET: Optional[str] = None
    SALESFORCE_REDIRECT_URI: str = "http://localhost:8000/api/integrations/salesforce/callback"

    # LinkedIn / Apollo / PhantomBuster
    APOLLO_API_KEY: Optional[str] = None
    PHANTOMBUSTER_API_KEY: Optional[str] = None

    # Gmail
    GMAIL_CLIENT_ID: Optional[str] = None
    GMAIL_CLIENT_SECRET: Optional[str] = None

    class Config:
        env_file = ".env"
        extra = "allow"


settings = Settings()
