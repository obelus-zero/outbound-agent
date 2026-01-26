from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional

from database import get_db
from models.prospect import Prospect, ProspectStatus
from models.message import Message, MessageStatus

router = APIRouter(prefix="/api/workflow", tags=["workflow"])


@router.get("/queue")
async def get_review_queue(
    status: Optional[str] = "ready_for_review",
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Get prospects in the review queue"""
    query = db.query(Prospect)

    if status == "ready_for_review":
        query = query.filter(Prospect.status == ProspectStatus.READY_FOR_REVIEW)
    elif status == "approved":
        query = query.filter(Prospect.status == ProspectStatus.APPROVED)

    # Order by ICP score (highest first)
    query = query.order_by(Prospect.icp_score.desc())

    total = query.count()
    prospects = query.offset((page - 1) * per_page).limit(per_page).all()

    return {
        "prospects": [
            {
                "id": p.id,
                "full_name": p.full_name,
                "first_name": p.first_name,
                "last_name": p.last_name,
                "title": p.title,
                "company_name": p.company_name,
                "email": p.email,
                "linkedin_url": p.linkedin_url,
                "icp_score": p.icp_score,
                "icp_match_reasons": p.icp_match_reasons,
                "research_summary": p.research_summary,
                "status": p.status.value
            }
            for p in prospects
        ],
        "total": total,
        "page": page,
        "per_page": per_page
    }


@router.post("/{prospect_id}/action")
async def workflow_action(
    prospect_id: int,
    action: str,
    db: Session = Depends(get_db)
):
    """Perform workflow action on a prospect"""
    prospect = db.query(Prospect).filter(Prospect.id == prospect_id).first()
    if not prospect:
        raise HTTPException(status_code=404, detail="Prospect not found")

    if action == "approve_all":
        # Approve all pending messages for this prospect
        db.query(Message).filter(
            Message.prospect_id == prospect_id,
            Message.status == MessageStatus.READY_FOR_REVIEW
        ).update({"status": MessageStatus.APPROVED})

        prospect.status = ProspectStatus.APPROVED
        db.commit()
        return {"message": "All messages approved"}

    elif action == "skip":
        # Reject all pending messages and mark prospect as skipped
        db.query(Message).filter(
            Message.prospect_id == prospect_id,
            Message.status == MessageStatus.READY_FOR_REVIEW
        ).update({"status": MessageStatus.REJECTED})

        prospect.status = ProspectStatus.NOT_INTERESTED
        db.commit()
        return {"message": "Prospect skipped"}

    elif action == "reset":
        # Reset prospect to new status
        prospect.status = ProspectStatus.NEW
        db.commit()
        return {"message": "Prospect reset"}

    else:
        raise HTTPException(status_code=400, detail=f"Unknown action: {action}")


@router.get("/stats")
async def get_workflow_stats(db: Session = Depends(get_db)):
    """Get workflow statistics"""
    return {
        "total_prospects": db.query(Prospect).count(),
        "new": db.query(Prospect).filter(Prospect.status == ProspectStatus.NEW).count(),
        "researching": db.query(Prospect).filter(Prospect.status == ProspectStatus.RESEARCHING).count(),
        "ready_for_review": db.query(Prospect).filter(Prospect.status == ProspectStatus.READY_FOR_REVIEW).count(),
        "approved": db.query(Prospect).filter(Prospect.status == ProspectStatus.APPROVED).count(),
        "contacted": db.query(Prospect).filter(Prospect.status == ProspectStatus.CONTACTED).count(),
        "responded": db.query(Prospect).filter(Prospect.status == ProspectStatus.RESPONDED).count(),
        "meeting_booked": db.query(Prospect).filter(Prospect.status == ProspectStatus.MEETING_BOOKED).count(),
        "converted": db.query(Prospect).filter(Prospect.status == ProspectStatus.CONVERTED).count(),
    }
