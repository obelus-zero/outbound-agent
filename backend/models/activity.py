from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON, Text, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from database import Base


class ActivityType(str, enum.Enum):
    PROSPECT_CREATED = "prospect_created"
    PROSPECT_IMPORTED = "prospect_imported"
    RESEARCH_COMPLETED = "research_completed"
    MESSAGE_GENERATED = "message_generated"
    MESSAGE_APPROVED = "message_approved"
    MESSAGE_REJECTED = "message_rejected"
    MESSAGE_SENT = "message_sent"
    MESSAGE_OPENED = "message_opened"
    MESSAGE_REPLIED = "message_replied"
    SEQUENCE_STARTED = "sequence_started"
    SEQUENCE_STEP_COMPLETED = "sequence_step_completed"
    STATUS_CHANGED = "status_changed"
    NOTE_ADDED = "note_added"


class Activity(Base):
    __tablename__ = "activities"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    prospect_id = Column(Integer, ForeignKey("prospects.id"), nullable=True)

    activity_type = Column(Enum(ActivityType), nullable=False)
    description = Column(String, nullable=True)
    activity_activity_activity_metadata = Column(JSON, default=dict)

    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="activities")
    prospect = relationship("Prospect", back_populates="activities")
