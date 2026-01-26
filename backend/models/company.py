from sqlalchemy import Column, Integer, String, DateTime, JSON, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base


class Company(Base):
    __tablename__ = "companies"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    domain = Column(String, nullable=True, index=True)
    website = Column(String, nullable=True)

    # Company details
    industry = Column(String, nullable=True)
    employee_count = Column(Integer, nullable=True)
    employee_range = Column(String, nullable=True)  # e.g., "50-200"
    revenue = Column(String, nullable=True)
    founded_year = Column(Integer, nullable=True)

    # Location
    headquarters = Column(String, nullable=True)
    city = Column(String, nullable=True)
    state = Column(String, nullable=True)
    country = Column(String, nullable=True)

    # Social & Online presence
    linkedin_url = Column(String, nullable=True)
    twitter_url = Column(String, nullable=True)
    crunchbase_url = Column(String, nullable=True)

    # Enriched data
    description = Column(Text, nullable=True)
    tech_stack = Column(JSON, default=list)
    keywords = Column(JSON, default=list)
    recent_news = Column(JSON, default=list)
    funding_info = Column(JSON, default=dict)

    # Integration IDs
    salesforce_id = Column(String, nullable=True, index=True)
    hubspot_id = Column(String, nullable=True)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    enriched_at = Column(DateTime, nullable=True)

    # Relationships
    prospects = relationship("Prospect", back_populates="company")
