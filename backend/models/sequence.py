from sqlalchemy import Column, Integer, String, ForeignKey, JSON, DateTime, Enum, Boolean, Text
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from database import Base


class StepType(str, enum.Enum):
    LINKEDIN_CONNECTION = "linkedin_connection"
    LINKEDIN_INMAIL = "linkedin_inmail"
    EMAIL = "email"
    PHONE_CALL = "phone_call"
    WAIT = "wait"


class StepStatus(str, enum.Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    SKIPPED = "skipped"


class ProspectSequence(Base):
    """Outreach sequence for a specific prospect"""
    __tablename__ = "prospect_sequences"

    id = Column(Integer, primary_key=True, index=True)
    prospect_id = Column(Integer, ForeignKey("prospects.id"), nullable=False)
    name = Column(String, default="Custom Sequence")
    is_active = Column(Boolean, default=True)
    current_step = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    prospect = relationship("Prospect", back_populates="sequence")
    steps = relationship("SequenceStep", back_populates="sequence", order_by="SequenceStep.order", cascade="all, delete-orphan")


class SequenceStep(Base):
    """Individual step in an outreach sequence"""
    __tablename__ = "sequence_steps"

    id = Column(Integer, primary_key=True, index=True)
    sequence_id = Column(Integer, ForeignKey("prospect_sequences.id"), nullable=False)
    order = Column(Integer, nullable=False)
    step_type = Column(Enum(StepType), nullable=False)
    status = Column(Enum(StepStatus), default=StepStatus.PENDING)

    # Step configuration
    subject = Column(String, nullable=True)
    content = Column(Text, nullable=True)
    wait_days = Column(Integer, default=0)
    notes = Column(Text, nullable=True)

    # Tracking
    scheduled_date = Column(DateTime, nullable=True)
    completed_date = Column(DateTime, nullable=True)
    response_received = Column(Boolean, default=False)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    sequence = relationship("ProspectSequence", back_populates="steps")


# Default sequence templates
DEFAULT_SEQUENCE_TEMPLATES = {
    "linkedin_first": {
        "name": "LinkedIn First",
        "description": "Start with LinkedIn connection, then InMail, then email",
        "steps": [
            {"type": "linkedin_connection", "content": ""},
            {"type": "wait", "wait_days": 3},
            {"type": "linkedin_inmail", "content": ""},
            {"type": "wait", "wait_days": 5},
            {"type": "email", "content": ""},
            {"type": "wait", "wait_days": 3},
            {"type": "phone_call", "notes": ""},
        ]
    },
    "email_first": {
        "name": "Email First",
        "description": "Lead with email, then follow up on LinkedIn",
        "steps": [
            {"type": "email", "content": ""},
            {"type": "wait", "wait_days": 3},
            {"type": "email", "content": ""},
            {"type": "wait", "wait_days": 2},
            {"type": "linkedin_connection", "content": ""},
            {"type": "wait", "wait_days": 3},
            {"type": "phone_call", "notes": ""},
        ]
    },
    "multi_channel": {
        "name": "Multi-Channel Blitz",
        "description": "Hit all channels quickly for maximum touchpoints",
        "steps": [
            {"type": "linkedin_connection", "content": ""},
            {"type": "email", "content": ""},
            {"type": "wait", "wait_days": 2},
            {"type": "linkedin_inmail", "content": ""},
            {"type": "wait", "wait_days": 2},
            {"type": "email", "content": ""},
            {"type": "phone_call", "notes": ""},
            {"type": "wait", "wait_days": 3},
            {"type": "email", "content": ""},
        ]
    },
    "gentle_touch": {
        "name": "Gentle Touch",
        "description": "Longer wait times, less aggressive approach",
        "steps": [
            {"type": "email", "content": ""},
            {"type": "wait", "wait_days": 7},
            {"type": "linkedin_connection", "content": ""},
            {"type": "wait", "wait_days": 7},
            {"type": "email", "content": ""},
            {"type": "wait", "wait_days": 7},
            {"type": "phone_call", "notes": ""},
        ]
    }
}
