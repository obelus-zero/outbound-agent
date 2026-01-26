from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from database import get_db
from models.message import Message, MessageStatus, MessageChannel
from models.prospect import Prospect, ProspectStatus
from models.icp import ICPConfig
from services.enrichment import EnrichmentService
from services.message_generator import MessageGenerator
from config import settings

router = APIRouter(prefix="/api/messages", tags=["messages"])


# Schemas
class GenerateRequest(BaseModel):
    prospect_id: int
    channels: List[MessageChannel] = [MessageChannel.LINKEDIN, MessageChannel.EMAIL]
    message_types: List[str] = ["initial"]


class MessageUpdate(BaseModel):
    content: Optional[str] = None
    subject: Optional[str] = None
    status: Optional[MessageStatus] = None


class MessageResponse(BaseModel):
    id: int
    prospect_id: int
    channel: MessageChannel
    message_type: str
    subject: Optional[str]
    content: str
    hook: Optional[str]
    status: MessageStatus
    created_at: datetime

    class Config:
        from_attributes = True


# Routes
@router.get("/", response_model=dict)
async def list_messages(
    status: Optional[MessageStatus] = None,
    prospect_id: Optional[int] = None,
    channel: Optional[MessageChannel] = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    query = db.query(Message)

    if status:
        query = query.filter(Message.status == status)
    if prospect_id:
        query = query.filter(Message.prospect_id == prospect_id)
    if channel:
        query = query.filter(Message.channel == channel)

    total = query.count()
    messages = query.order_by(Message.created_at.desc()).offset((page - 1) * per_page).limit(per_page).all()

    # Include prospect info for approved messages
    result = []
    for msg in messages:
        msg_dict = {
            "id": msg.id,
            "prospect_id": msg.prospect_id,
            "channel": msg.channel,
            "message_type": msg.message_type,
            "subject": msg.subject,
            "content": msg.content,
            "hook": msg.hook,
            "status": msg.status,
            "created_at": msg.created_at,
        }
        if msg.prospect:
            msg_dict["prospect"] = {
                "id": msg.prospect.id,
                "full_name": msg.prospect.full_name,
                "first_name": msg.prospect.first_name,
                "last_name": msg.prospect.last_name,
                "title": msg.prospect.title,
                "company_name": msg.prospect.company_name,
                "email": msg.prospect.email,
                "linkedin_url": msg.prospect.linkedin_url,
            }
        result.append(msg_dict)

    return {
        "messages": result,
        "total": total,
        "page": page,
        "per_page": per_page
    }


@router.get("/prospect/{prospect_id}")
async def get_prospect_messages(prospect_id: int, db: Session = Depends(get_db)):
    messages = db.query(Message).filter(Message.prospect_id == prospect_id).order_by(Message.created_at.desc()).all()
    return messages


@router.post("/generate")
async def generate_messages(request: GenerateRequest, db: Session = Depends(get_db)):
    """Generate AI-powered messages for a prospect"""
    # Get prospect
    prospect = db.query(Prospect).filter(Prospect.id == request.prospect_id).first()
    if not prospect:
        raise HTTPException(status_code=404, detail="Prospect not found")

    # Get ICP config
    icp_config = db.query(ICPConfig).filter(ICPConfig.is_default == True).first()
    if not icp_config:
        raise HTTPException(status_code=400, detail="No ICP configuration found. Please create one first.")

    # Check for API key
    if not settings.ANTHROPIC_API_KEY:
        raise HTTPException(status_code=400, detail="Anthropic API key not configured")

    # Update prospect status
    prospect.status = ProspectStatus.RESEARCHING
    db.commit()

    try:
        # Research the prospect
        enrichment_service = EnrichmentService()
        research_data = await enrichment_service.research_prospect(
            prospect_data={
                "name": prospect.full_name,
                "title": prospect.title,
                "company": prospect.company_name,
                "linkedin_url": prospect.linkedin_url,
                "twitter_url": prospect.twitter_url,
            },
            icp_context=icp_config.to_prompt_context()
        )

        # Update prospect with research
        prospect.research_summary = research_data.get("summary", "")
        prospect.research_data = research_data
        prospect.personalization_hooks = research_data.get("personalization_hooks", [])
        prospect.researched_at = datetime.utcnow()

        # Update ICP score
        icp_signals = research_data.get("icp_signals_found", {})
        prospect.icp_score = icp_signals.get("confidence_score", 50)
        prospect.icp_match_reasons = icp_signals.get("positive_signals", [])

        # Generate messages
        message_generator = MessageGenerator()
        generated_messages = []

        for channel in request.channels:
            for msg_type in request.message_types:
                message_content = await message_generator.generate(
                    prospect_data={
                        "name": prospect.full_name,
                        "first_name": prospect.first_name,
                        "title": prospect.title,
                        "company": prospect.company_name,
                    },
                    research_data=research_data,
                    icp_context=icp_config.to_prompt_context(),
                    channel=channel.value,
                    message_type=msg_type
                )

                message = Message(
                    prospect_id=prospect.id,
                    channel=channel,
                    message_type=msg_type,
                    subject=message_content.get("subject"),
                    content=message_content.get("body", message_content.get("content", "")),
                    hook=message_content.get("hook"),
                    status=MessageStatus.READY_FOR_REVIEW,
                    generation_context={
                        "research": research_data,
                        "icp": icp_config.name
                    }
                )
                db.add(message)
                generated_messages.append(message)

        # Update prospect status
        prospect.status = ProspectStatus.READY_FOR_REVIEW
        db.commit()

        return {
            "message": "Messages generated successfully",
            "research_summary": prospect.research_summary,
            "icp_score": prospect.icp_score,
            "messages_generated": len(generated_messages)
        }

    except Exception as e:
        prospect.status = ProspectStatus.NEW
        db.commit()
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")


@router.put("/{message_id}")
async def update_message(message_id: int, data: MessageUpdate, db: Session = Depends(get_db)):
    message = db.query(Message).filter(Message.id == message_id).first()
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")

    for key, value in data.dict(exclude_unset=True).items():
        setattr(message, key, value)

    # Track edits
    if data.content:
        edit_history = message.edit_history or []
        edit_history.append({
            "timestamp": datetime.utcnow().isoformat(),
            "field": "content"
        })
        message.edit_history = edit_history

    db.commit()
    db.refresh(message)
    return message


@router.post("/{message_id}/approve")
async def approve_message(message_id: int, db: Session = Depends(get_db)):
    message = db.query(Message).filter(Message.id == message_id).first()
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")

    message.status = MessageStatus.APPROVED
    db.commit()
    return {"message": "Message approved"}


@router.post("/{message_id}/reject")
async def reject_message(message_id: int, db: Session = Depends(get_db)):
    message = db.query(Message).filter(Message.id == message_id).first()
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")

    message.status = MessageStatus.REJECTED
    db.commit()
    return {"message": "Message rejected"}


@router.post("/{message_id}/regenerate")
async def regenerate_message(message_id: int, db: Session = Depends(get_db)):
    """Regenerate a specific message"""
    message = db.query(Message).filter(Message.id == message_id).first()
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")

    prospect = message.prospect
    icp_config = db.query(ICPConfig).filter(ICPConfig.is_default == True).first()

    if not settings.ANTHROPIC_API_KEY:
        raise HTTPException(status_code=400, detail="Anthropic API key not configured")

    try:
        message_generator = MessageGenerator()
        new_content = await message_generator.generate(
            prospect_data={
                "name": prospect.full_name,
                "first_name": prospect.first_name,
                "title": prospect.title,
                "company": prospect.company_name,
            },
            research_data=prospect.research_data or {},
            icp_context=icp_config.to_prompt_context() if icp_config else {},
            channel=message.channel.value,
            message_type=message.message_type
        )

        message.subject = new_content.get("subject")
        message.content = new_content.get("body", new_content.get("content", ""))
        message.hook = new_content.get("hook")
        message.status = MessageStatus.READY_FOR_REVIEW
        db.commit()

        return {"message": "Message regenerated", "content": message.content}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Regeneration failed: {str(e)}")


@router.post("/{message_id}/mark-sent")
async def mark_sent(message_id: int, db: Session = Depends(get_db)):
    message = db.query(Message).filter(Message.id == message_id).first()
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")

    message.status = MessageStatus.SENT
    message.sent_at = datetime.utcnow()

    # Update prospect status
    prospect = message.prospect
    if prospect:
        prospect.status = ProspectStatus.CONTACTED
        prospect.last_contacted_at = datetime.utcnow()

    db.commit()
    return {"message": "Message marked as sent"}
