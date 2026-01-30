from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime, timedelta

from database import get_db
from models.sequence import Sequence, SequenceStep, ProspectSequence, SequenceStatus, StepType, DEFAULT_SEQUENCE_TEMPLATES

router = APIRouter(prefix="/api/sequences", tags=["sequences"])


class StepCreate(BaseModel):
    step_type: str
    order: int
    name: Optional[str] = None
    delay_days: int = 0
    delay_hours: int = 0


class SequenceCreate(BaseModel):
    name: str
    description: Optional[str] = None
    steps: List[StepCreate] = []


class EnrollRequest(BaseModel):
    prospect_ids: List[int]
    sequence_id: int


@router.get("/templates")
async def get_templates():
    return DEFAULT_SEQUENCE_TEMPLATES


@router.get("")
async def list_sequences(db: Session = Depends(get_db)):
    seqs = db.query(Sequence).order_by(Sequence.created_at.desc()).all()
    result = []
    for seq in seqs:
        result.append({
            "id": seq.id,
            "name": seq.name,
            "description": seq.description,
            "status": seq.status.value if seq.status else "draft",
            "steps": [
                {
                    "id": step.id,
                    "order": step.order,
                    "step_type": step.step_type.value if step.step_type else None,
                    "name": step.name,
                    "delay_days": step.delay_days,
                }
                for step in sorted(seq.steps, key=lambda x: x.order)
            ],
            "created_at": seq.created_at.isoformat() if seq.created_at else None,
        })
    return result


@router.get("/{sequence_id}")
async def get_sequence(sequence_id: int, db: Session = Depends(get_db)):
    seq = db.query(Sequence).filter(Sequence.id == sequence_id).first()
    if not seq:
        raise HTTPException(status_code=404, detail="Sequence not found")
    return {
        "id": seq.id,
        "name": seq.name,
        "description": seq.description,
        "status": seq.status.value if seq.status else "draft",
        "steps": [
            {
                "id": step.id,
                "order": step.order,
                "step_type": step.step_type.value if step.step_type else None,
                "name": step.name,
                "delay_days": step.delay_days,
            }
            for step in sorted(seq.steps, key=lambda x: x.order)
        ],
    }


@router.post("")
async def create_sequence(data: SequenceCreate, db: Session = Depends(get_db)):
    seq = Sequence(
        name=data.name,
        description=data.description,
        status=SequenceStatus.DRAFT,
    )
    db.add(seq)
    db.commit()
    db.refresh(seq)

    for step_data in data.steps:
        step = SequenceStep(
            sequence_id=seq.id,
            order=step_data.order,
            step_type=StepType(step_data.step_type),
            name=step_data.name,
            delay_days=step_data.delay_days,
            delay_hours=step_data.delay_hours,
        )
        db.add(step)

    db.commit()
    db.refresh(seq)

    return {
        "id": seq.id,
        "name": seq.name,
        "description": seq.description,
        "status": seq.status.value,
        "steps": [{"id": s.id, "order": s.order, "step_type": s.step_type.value, "name": s.name, "delay_days": s.delay_days} for s in seq.steps],
    }


@router.delete("/{sequence_id}")
async def delete_sequence(sequence_id: int, db: Session = Depends(get_db)):
    seq = db.query(Sequence).filter(Sequence.id == sequence_id).first()
    if not seq:
        raise HTTPException(status_code=404, detail="Sequence not found")
    db.query(SequenceStep).filter(SequenceStep.sequence_id == sequence_id).delete()
    db.delete(seq)
    db.commit()
    return {"status": "deleted"}


@router.post("/enroll")
async def enroll_prospects(data: EnrollRequest, db: Session = Depends(get_db)):
    seq = db.query(Sequence).filter(Sequence.id == data.sequence_id).first()
    if not seq:
        raise HTTPException(status_code=404, detail="Sequence not found")
    enrolled = []
    for prospect_id in data.prospect_ids:
        ps = ProspectSequence(
            prospect_id=prospect_id,
            sequence_id=data.sequence_id,
            current_step=1,
            status=SequenceStatus.ACTIVE,
        )
        db.add(ps)
        enrolled.append(prospect_id)
    db.commit()
    return {"enrolled": enrolled, "sequence_id": data.sequence_id}


@router.get("/prospect/{prospect_id}")
async def get_prospect_sequences(prospect_id: int, db: Session = Depends(get_db)):
    sequences = db.query(ProspectSequence).filter(ProspectSequence.prospect_id == prospect_id).all()
    return [{"id": ps.id, "sequence_id": ps.sequence_id, "current_step": ps.current_step, "status": ps.status.value if ps.status else "active"} for ps in sequences]
