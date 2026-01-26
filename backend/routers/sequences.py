from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime, timedelta

from database import get_db
from models.sequence import ProspectSequence, SequenceStep, StepType, StepStatus, DEFAULT_SEQUENCE_TEMPLATES

router = APIRouter(prefix="/api/sequences", tags=["sequences"])


# Schemas
class StepCreate(BaseModel):
    step_type: StepType
    order: Optional[int] = None
    subject: Optional[str] = None
    content: Optional[str] = None
    wait_days: Optional[int] = 0
    notes: Optional[str] = None


class StepUpdate(BaseModel):
    order: Optional[int] = None
    subject: Optional[str] = None
    content: Optional[str] = None
    wait_days: Optional[int] = None
    notes: Optional[str] = None
    status: Optional[StepStatus] = None


class SequenceCreate(BaseModel):
    prospect_id: int
    name: Optional[str] = "Custom Sequence"
    template: Optional[str] = None


class ReorderSteps(BaseModel):
    step_ids: List[int]


# Routes
@router.get("/templates")
async def get_templates():
    """Get available sequence templates"""
    return DEFAULT_SEQUENCE_TEMPLATES


@router.get("/prospect/{prospect_id}")
async def get_prospect_sequence(prospect_id: int, db: Session = Depends(get_db)):
    """Get the active sequence for a prospect"""
    sequence = db.query(ProspectSequence).filter(
        ProspectSequence.prospect_id == prospect_id,
        ProspectSequence.is_active == True
    ).first()

    if not sequence:
        return None

    return {
        "id": sequence.id,
        "name": sequence.name,
        "current_step": sequence.current_step,
        "steps": [
            {
                "id": step.id,
                "order": step.order,
                "step_type": step.step_type.value,
                "status": step.status.value,
                "subject": step.subject,
                "content": step.content,
                "wait_days": step.wait_days,
                "notes": step.notes,
                "scheduled_date": step.scheduled_date.isoformat() if step.scheduled_date else None,
                "completed_date": step.completed_date.isoformat() if step.completed_date else None,
                "response_received": step.response_received
            }
            for step in sorted(sequence.steps, key=lambda x: x.order)
        ]
    }


@router.post("/")
async def create_sequence(data: SequenceCreate, db: Session = Depends(get_db)):
    """Create a new sequence for a prospect"""
    # Deactivate any existing sequences
    db.query(ProspectSequence).filter(
        ProspectSequence.prospect_id == data.prospect_id
    ).update({"is_active": False})

    # Create new sequence
    template_name = data.template or "custom"
    template = DEFAULT_SEQUENCE_TEMPLATES.get(data.template, {})

    sequence = ProspectSequence(
        prospect_id=data.prospect_id,
        name=template.get("name", data.name or "Custom Sequence")
    )
    db.add(sequence)
    db.flush()

    # Add steps from template
    if data.template and template:
        for i, step_data in enumerate(template.get("steps", [])):
            step = SequenceStep(
                sequence_id=sequence.id,
                order=i,
                step_type=StepType(step_data["type"]),
                content=step_data.get("content"),
                wait_days=step_data.get("wait_days", 0),
                notes=step_data.get("notes"),
                status=StepStatus.IN_PROGRESS if i == 0 else StepStatus.PENDING
            )
            db.add(step)

    db.commit()
    db.refresh(sequence)

    return {"id": sequence.id, "message": "Sequence created", "name": sequence.name}


@router.post("/{sequence_id}/steps")
async def add_step(sequence_id: int, step: StepCreate, db: Session = Depends(get_db)):
    """Add a step to a sequence"""
    sequence = db.query(ProspectSequence).filter(ProspectSequence.id == sequence_id).first()
    if not sequence:
        raise HTTPException(status_code=404, detail="Sequence not found")

    # Get max order
    max_order = db.query(SequenceStep).filter(
        SequenceStep.sequence_id == sequence_id
    ).count()

    order = step.order if step.order is not None else max_order

    # Shift existing steps if inserting
    if step.order is not None:
        db.query(SequenceStep).filter(
            SequenceStep.sequence_id == sequence_id,
            SequenceStep.order >= order
        ).update({"order": SequenceStep.order + 1})

    new_step = SequenceStep(
        sequence_id=sequence_id,
        order=order,
        step_type=step.step_type,
        subject=step.subject,
        content=step.content,
        wait_days=step.wait_days or 0,
        notes=step.notes
    )
    db.add(new_step)
    db.commit()

    return {"id": new_step.id, "message": "Step added"}


@router.put("/steps/{step_id}")
async def update_step(step_id: int, data: StepUpdate, db: Session = Depends(get_db)):
    """Update a step"""
    step = db.query(SequenceStep).filter(SequenceStep.id == step_id).first()
    if not step:
        raise HTTPException(status_code=404, detail="Step not found")

    for key, value in data.dict(exclude_unset=True).items():
        setattr(step, key, value)

    db.commit()
    return {"message": "Step updated"}


@router.delete("/steps/{step_id}")
async def delete_step(step_id: int, db: Session = Depends(get_db)):
    """Delete a step"""
    step = db.query(SequenceStep).filter(SequenceStep.id == step_id).first()
    if not step:
        raise HTTPException(status_code=404, detail="Step not found")

    sequence_id = step.sequence_id
    order = step.order

    db.delete(step)

    # Reorder remaining steps
    db.query(SequenceStep).filter(
        SequenceStep.sequence_id == sequence_id,
        SequenceStep.order > order
    ).update({"order": SequenceStep.order - 1})

    db.commit()
    return {"message": "Step deleted"}


@router.post("/{sequence_id}/reorder")
async def reorder_steps(sequence_id: int, data: ReorderSteps, db: Session = Depends(get_db)):
    """Reorder steps in a sequence"""
    for i, step_id in enumerate(data.step_ids):
        db.query(SequenceStep).filter(SequenceStep.id == step_id).update({"order": i})

    db.commit()
    return {"message": "Steps reordered"}


@router.post("/steps/{step_id}/complete")
async def complete_step(
    step_id: int,
    response_received: bool = False,
    db: Session = Depends(get_db)
):
    """Mark a step as completed and advance to next"""
    step = db.query(SequenceStep).filter(SequenceStep.id == step_id).first()
    if not step:
        raise HTTPException(status_code=404, detail="Step not found")

    step.status = StepStatus.COMPLETED
    step.completed_date = datetime.utcnow()
    step.response_received = response_received

    # Advance sequence to next step
    sequence = step.sequence
    next_step_order = step.order + 1
    next_step = db.query(SequenceStep).filter(
        SequenceStep.sequence_id == sequence.id,
        SequenceStep.order == next_step_order
    ).first()

    if next_step:
        sequence.current_step = next_step_order
        next_step.status = StepStatus.IN_PROGRESS

        # Calculate scheduled date for wait steps
        if next_step.step_type == StepType.WAIT:
            next_step.scheduled_date = datetime.utcnow() + timedelta(days=next_step.wait_days)

    db.commit()

    return {
        "message": "Step completed",
        "next_step": next_step.id if next_step else None,
        "sequence_complete": next_step is None
    }


@router.post("/steps/{step_id}/skip")
async def skip_step(step_id: int, db: Session = Depends(get_db)):
    """Skip a step and move to next"""
    step = db.query(SequenceStep).filter(SequenceStep.id == step_id).first()
    if not step:
        raise HTTPException(status_code=404, detail="Step not found")

    step.status = StepStatus.SKIPPED
    db.commit()

    # Move to next step
    return await complete_step(step_id, response_received=False, db=db)
