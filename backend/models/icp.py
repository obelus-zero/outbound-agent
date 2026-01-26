from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON, Text, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base


class ICPConfig(Base):
    """Ideal Customer Profile Configuration"""
    __tablename__ = "icp_configs"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    is_default = Column(Boolean, default=False)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)

    # Your Product/Service
    product_name = Column(String, nullable=True)
    company_name = Column(String, nullable=True)
    product_description = Column(Text, nullable=True)

    # Target Company Criteria
    target_industries = Column(JSON, default=list)  # ["Technology", "Financial Services"]
    company_size_min = Column(Integer, default=50)
    company_size_max = Column(Integer, default=10000)
    company_size_labels = Column(JSON, default=list)  # ["50-200", "200-1000"]
    target_locations = Column(JSON, default=list)  # ["United States", "Canada"]
    revenue_min = Column(Integer, nullable=True)
    revenue_max = Column(Integer, nullable=True)

    # Target Persona Criteria
    target_titles = Column(JSON, default=list)  # ["VP Engineering", "CISO"]
    title_keywords = Column(JSON, default=list)  # ["security", "engineering", "devops"]
    exclude_titles = Column(JSON, default=list)  # ["Intern", "Student"]
    target_seniority = Column(JSON, default=list)  # ["Director", "VP", "C-Level"]

    # Signal Detection
    positive_signals = Column(JSON, default=list)  # Keywords indicating good fit
    negative_signals = Column(JSON, default=list)  # Keywords indicating bad fit
    tech_stack_positive = Column(JSON, default=list)  # Technologies they should use
    tech_stack_negative = Column(JSON, default=list)  # Technologies that disqualify
    trigger_events = Column(JSON, default=list)  # ["recent funding", "new hire"]

    # Pain Points & Value Props
    pain_points = Column(JSON, default=list)
    value_propositions = Column(JSON, default=list)

    # Messaging Guidance
    messaging_tone = Column(String, default="professional")  # professional, casual, technical
    avoid_phrases = Column(JSON, default=list)
    custom_instructions = Column(Text, nullable=True)

    # Scoring Weights (must sum to 100)
    weight_title_match = Column(Integer, default=25)
    weight_company_fit = Column(Integer, default=25)
    weight_signals = Column(Integer, default=30)
    weight_trigger_events = Column(Integer, default=20)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    created_by_user = relationship("User", back_populates="icp_configs")

    def to_prompt_context(self) -> dict:
        """Convert ICP config to context for AI prompts"""
        return {
            "product": {
                "name": self.product_name,
                "company": self.company_name,
                "description": self.product_description
            },
            "target_company": {
                "industries": self.target_industries,
                "size_range": f"{self.company_size_min}-{self.company_size_max}",
                "locations": self.target_locations
            },
            "target_persona": {
                "titles": self.target_titles,
                "title_keywords": self.title_keywords,
                "seniority": self.target_seniority,
                "exclude": self.exclude_titles
            },
            "signals": {
                "positive": self.positive_signals,
                "negative": self.negative_signals,
                "tech_stack_positive": self.tech_stack_positive,
                "tech_stack_negative": self.tech_stack_negative,
                "triggers": self.trigger_events
            },
            "messaging": {
                "pain_points": self.pain_points,
                "value_props": self.value_propositions,
                "tone": self.messaging_tone,
                "avoid": self.avoid_phrases,
                "instructions": self.custom_instructions
            }
        }
