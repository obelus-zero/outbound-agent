from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel
import os

from database import get_db
from config import settings

router = APIRouter(prefix="/api/integrations", tags=["integrations"])


# Schemas
class SalesforceConfig(BaseModel):
    client_id: str
    client_secret: str
    redirect_uri: Optional[str] = None


class IntegrationStatus(BaseModel):
    name: str
    connected: bool
    configured: bool


# Routes
@router.get("/status")
async def get_integration_status():
    """Get status of all integrations"""
    return {
        "salesforce": {
            "name": "Salesforce",
            "configured": bool(settings.SALESFORCE_CLIENT_ID),
            "connected": False  # Would check for valid token
        },
        "prospect_io": {
            "name": "Prospect.io",
            "configured": bool(settings.PROSPECT_IO_API_KEY),
            "connected": bool(settings.PROSPECT_IO_API_KEY)
        },
        "apollo": {
            "name": "Apollo.io",
            "configured": bool(settings.APOLLO_API_KEY),
            "connected": bool(settings.APOLLO_API_KEY)
        },
        "anthropic": {
            "name": "Claude AI",
            "configured": bool(settings.ANTHROPIC_API_KEY),
            "connected": bool(settings.ANTHROPIC_API_KEY)
        },
        "gmail": {
            "name": "Gmail",
            "configured": bool(settings.GMAIL_CLIENT_ID),
            "connected": False
        }
    }


@router.get("/salesforce/auth-url")
async def get_salesforce_auth_url():
    """Get Salesforce OAuth authorization URL"""
    if not settings.SALESFORCE_CLIENT_ID:
        raise HTTPException(status_code=400, detail="Salesforce not configured")

    auth_url = (
        f"https://login.salesforce.com/services/oauth2/authorize"
        f"?response_type=code"
        f"&client_id={settings.SALESFORCE_CLIENT_ID}"
        f"&redirect_uri={settings.SALESFORCE_REDIRECT_URI}"
        f"&scope=api refresh_token"
    )
    return {"auth_url": auth_url}


@router.get("/salesforce/callback")
async def salesforce_callback(code: str, db: Session = Depends(get_db)):
    """Handle Salesforce OAuth callback"""
    # Would exchange code for tokens and store them
    return {"message": "Salesforce connected successfully"}


@router.post("/salesforce/sync")
async def sync_salesforce(db: Session = Depends(get_db)):
    """Sync prospects from Salesforce"""
    if not settings.SALESFORCE_CLIENT_ID:
        raise HTTPException(status_code=400, detail="Salesforce not configured")

    # Would fetch leads/contacts from Salesforce
    return {"message": "Sync started", "synced": 0}


@router.post("/linkedin/import")
async def import_linkedin_export(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Import connections from LinkedIn export CSV"""
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="File must be a CSV")

    # Would parse LinkedIn export format
    return {"message": "Import complete", "imported": 0}
