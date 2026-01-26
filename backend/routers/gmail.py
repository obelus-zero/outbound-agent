from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from urllib.parse import quote
import os

router = APIRouter(prefix="/api/gmail", tags=["gmail"])


class EmailCompose(BaseModel):
    to: str
    subject: Optional[str] = ""
    body: Optional[str] = ""
    prospect_id: Optional[int] = None


@router.post("/compose")
async def compose_email(email: EmailCompose):
    """Generate Gmail compose URL and mailto link"""
    # URL encode the content
    encoded_subject = quote(email.subject or "")
    encoded_body = quote(email.body or "")

    # Gmail compose URL (opens in Gmail web)
    gmail_url = (
        f"https://mail.google.com/mail/?view=cm"
        f"&to={email.to}"
        f"&su={encoded_subject}"
        f"&body={encoded_body}"
    )

    # Mailto fallback (opens default email client)
    mailto_url = (
        f"mailto:{email.to}"
        f"?subject={encoded_subject}"
        f"&body={encoded_body}"
    )

    return {
        "gmail_url": gmail_url,
        "mailto_url": mailto_url
    }


@router.get("/status")
async def gmail_status():
    """Check if Gmail OAuth is configured"""
    has_oauth = bool(os.getenv("GMAIL_CLIENT_ID"))
    return {
        "configured": has_oauth,
        "mode": "oauth" if has_oauth else "compose_url"
    }
