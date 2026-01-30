from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON, Text, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from database import Base


class ProspectStatus(str, enum.Enum):
    NEW = "new"
    RESEARCHING = "researching"
    READY_FOR_REVIEW = "ready_for_review"
    APPROVED = "approved"
    IN_SEQUENCE = "in_sequence"
    CONTACTED = "contacted"
    RESPONDED = "responded"
    MEETING_BOOKED = "meeting_booked"
    CONVERTED = "converted"
    NOT_INTERESTED = "not_interested"
    BOUNCED = "bounced"


class Prospect(Base):
    __tablename__ = "prospects"

    id = Column(Integer, primary_key=True, index=True)

    # Basic info
    first_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)
    full_name = Column(String, nullable=False, index=True)
    email = Column(String, nullable=True, index=True)
    phone = Column(String, nullable=True)

    # Professional info
    title = Column(String, nullable=True)
    seniority = Column(String, nullable=True)  # C-Level, VP, Director, Manager, etc.
    department = Column(String, nullable=True)

    # Company
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=True)
    company_name = Column(String, nullable=True)  # Denormalized for quick access

    # Social profiles
    linkedin_url = Column(String, nullable=True)
    twitter_url = Column(String, nullable=True)
    personal_website = Column(String, nullable=True)

    # Location
    city = Column(String, nullable=True)
    state = Column(String, nullable=True)
    country = Column(String, nullable=True)
    timezone = Column(String, nullable=True)

    # Status & Workflow
    status = Column(Enum(ProspectStatus), default=ProspectStatus.NEW)
    source = Column(String, nullable=True)  # csv, salesforce, linkedin, manual, prospect_io

    # ICP Scoring
    icp_score = Column(Integer, default=0)  # 0-100
    icp_match_reasons = Column(JSON, default=list)
    icp_concerns = Column(JSON, default=list)

    # Research data
    research_summary = Column(Text, nullable=True)
    research_data = Column(JSON, default=dict)
    linkedin_data = Column(JSON, default=dict)
    twitter_data = Column(JSON, default=dict)

    # Personalization hooks
    personalization_hooks = Column(JSON, default=list)
    pain_points_identified = Column(JSON, default=list)
    mutual_connections = Column(JSON, default=list)
    recent_activity = Column(JSON, default=list)

    # Integration IDs
    salesforce_id = Column(String, nullable=True, index=True)
    hubspot_id = Column(String, nullable=True)
    prospect_io_id = Column(String, nullable=True)
    apollo_id = Column(String, nullable=True)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    researched_at = Column(DateTime, nullable=True)
    last_contacted_at = Column(DateTime, nullable=True)

    # Relationships
    company = relationship("Company", back_populates="prospects")
    messages = relationship("Message", back_populates="prospect")
    activities = relationship("Activity", back_populates="prospect")
    sequences = relationship("ProspectSequence", back_populates="prospect")
    sequence = relationship("ProspectSequence", back_populates="prospect", uselist=False)
