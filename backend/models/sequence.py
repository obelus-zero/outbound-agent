from sqlalchemy import Column, Integer, String, DateTime, Text, JSON, ForeignKey, Boolean, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from database import Base


class SequenceStatus(str, enum.Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    PAUSED = "paused"
    COMPLETED = "completed"


class StepStatus(str, enum.Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    SKIPPED = "skipped"


class StepType(str, enum.Enum):
    LINKEDIN_CONNECTION = "linkedin_connection"
    LINKEDIN_DM = "linkedin_dm"
    LINKEDIN_INMAIL = "linkedin_inmail"
    COLD_EMAIL = "cold_email"
    FOLLOW_UP_EMAIL = "follow_up_email"
    COLD_CALL = "cold_call"
    VOICEMAIL = "voicemail"
    WAIT = "wait"
    TASK = "task"


DEFAULT_SEQUENCE_TEMPLATES = {
    "standard": [
        {"order": 1, "step_type": "linkedin_connection", "name": "LinkedIn Connection", "delay_days": 0},
        {"order": 2, "step_type": "cold_email", "name": "Initial Email", "delay_days": 2},
        {"order": 3, "step_type": "linkedin_inmail", "name": "LinkedIn InMail", "delay_days": 3},
        {"order": 4, "step_type": "cold_call", "name": "Cold Call", "delay_days": 2},
        {"order": 5, "step_type": "voicemail", "name": "Voicemail", "delay_days": 0},
        {"order": 6, "step_type": "follow_up_email", "name": "Follow-up Email", "delay_days": 3},
    ]
}


class Sequence(Base):
    __tablename__ = "sequences"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    status = Column(SQLEnum(SequenceStatus), default=SequenceStatus.DRAFT)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_by_user = relationship("User", back_populates="sequences")
    icp_config_id = Column(Integer, ForeignKey("icp_configs.id"), nullable=True)
    is_default = Column(Boolean, default=False)
    steps = relationship("SequenceStep", back_populates="sequence", order_by="SequenceStep.order")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class SequenceStep(Base):
    __tablename__ = "sequence_steps"
    id = Column(Integer, primary_key=True, index=True)
    sequence_id = Column(Integer, ForeignKey("sequences.id"), nullable=False)
    sequence = relationship("Sequence", back_populates="steps")
    order = Column(Integer, nullable=False)
    step_type = Column(SQLEnum(StepType), nullable=False)
    name = Column(String(255))
    delay_days = Column(Integer, default=0)
    delay_hours = Column(Integer, default=0)
    template = Column(Text)
    instructions = Column(Text)
    is_optional = Column(Boolean, default=False)
    stop_on_reply = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class ProspectSequence(Base):
    __tablename__ = "prospect_sequences"
    id = Column(Integer, primary_key=True, index=True)
    prospect_id = Column(Integer, ForeignKey("prospects.id"), nullable=False)
    prospect = relationship("Prospect", back_populates="sequences")
    sequence_id = Column(Integer, ForeignKey("sequences.id"), nullable=False)
    sequence = relationship("Sequence")
    current_step = Column(Integer, default=1)
    status = Column(SQLEnum(SequenceStatus), default=SequenceStatus.ACTIVE)
    started_at = Column(DateTime, default=datetime.utcnow)
    next_step_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    notes = Column(Text)