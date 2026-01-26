from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON, Text, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from database import Base


class MessageStatus(str, enum.Enum):
    DRAFT = "draft"
    READY_FOR_REVIEW = "ready_for_review"
    APPROVED = "approved"
    SENT = "sent"
    DELIVERED = "delivered"
    OPENED = "opened"
    CLICKED = "clicked"
    REPLIED = "replied"
    BOUNCED = "bounced"
    REJECTED = "rejected"


class MessageChannel(str, enum.Enum):
    EMAIL = "email"
    LINKEDIN = "linkedin"
    LINKEDIN_INMAIL = "linkedin_inmail"
    LINKEDIN_CONNECTION = "linkedin_connection"
    PHONE = "phone"
    SMS = "sms"


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    prospect_id = Column(Integer, ForeignKey("prospects.id"), nullable=False)
    sequence_step_id = Column(Integer, ForeignKey("sequence_steps.id"), nullable=True)

    # Message content
    channel = Column(Enum(MessageChannel), nullable=False)
    message_type = Column(String, default="initial")  # initial, follow_up_1, follow_up_2, breakup
    subject = Column(String, nullable=True)  # For emails
    content = Column(Text, nullable=False)

    # Personalization
    hook = Column(String, nullable=True)  # The personalization hook used
    template_id = Column(String, nullable=True)

    # Status
    status = Column(Enum(MessageStatus), default=MessageStatus.DRAFT)

    # Tracking
    sent_at = Column(DateTime, nullable=True)
    delivered_at = Column(DateTime, nullable=True)
    opened_at = Column(DateTime, nullable=True)
    clicked_at = Column(DateTime, nullable=True)
    replied_at = Column(DateTime, nullable=True)

    # Metadata
    generation_context = Column(JSON, default=dict)  # What data was used to generate
    edit_history = Column(JSON, default=list)  # Track manual edits

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    prospect = relationship("Prospect", back_populates="messages")
