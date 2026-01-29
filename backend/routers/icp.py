from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from database import get_db
from models.icp import ICPConfig
from routers.auth import get_current_user
from models.user import User

router = APIRouter(prefix="/api/icp", tags=["icp"], redirect_slashes=False)


# Schemas
class ICPCreate(BaseModel):
    name: str
    description: Optional[str] = None
    product_name: Optional[str] = None
    company_name: Optional[str] = None
    product_description: Optional[str] = None
    target_industries: List[str] = []
    company_size_min: int = 50
    company_size_max: int = 10000
    target_locations: List[str] = []
    target_titles: List[str] = []
    title_keywords: List[str] = []
    exclude_titles: List[str] = []
    target_seniority: List[str] = []
    positive_signals: List[str] = []
    negative_signals: List[str] = []
    tech_stack_positive: List[str] = []
    tech_stack_negative: List[str] = []
    trigger_events: List[str] = []
    pain_points: List[str] = []
    value_propositions: List[str] = []
    messaging_tone: str = "professional"
    avoid_phrases: List[str] = []
    custom_instructions: Optional[str] = None


class ICPUpdate(ICPCreate):
    name: Optional[str] = None


class ICPResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    is_active: bool
    is_default: bool
    product_name: Optional[str]
    company_name: Optional[str]
    product_description: Optional[str]
    target_industries: List[str]
    company_size_min: int
    company_size_max: int
    target_locations: List[str]
    target_titles: List[str]
    title_keywords: List[str]
    exclude_titles: List[str]
    target_seniority: List[str]
    positive_signals: List[str]
    negative_signals: List[str]
    tech_stack_positive: List[str]
    tech_stack_negative: List[str]
    trigger_events: List[str]
    pain_points: List[str]
    value_propositions: List[str]
    messaging_tone: str
    avoid_phrases: List[str]
    custom_instructions: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# Routes
@router.get("", response_model=List[ICPResponse])
async def list_icp_configs(db: Session = Depends(get_db)):
    return db.query(ICPConfig).filter(ICPConfig.is_active == True).all()


@router.get("/active", response_model=Optional[ICPResponse])
async def get_active_icp(db: Session = Depends(get_db)):
    return db.query(ICPConfig).filter(ICPConfig.is_default == True).first()


@router.get("/templates/semgrep")
async def get_semgrep_template():
    """Get a pre-built Semgrep ICP template"""
    return {
        "name": "Semgrep ICP",
        "description": "Ideal Customer Profile for Semgrep - Code Security Platform",
        "product_name": "Semgrep",
        "company_name": "Semgrep",
        "product_description": "Semgrep is a fast, open-source static analysis tool for finding bugs, detecting vulnerabilities, and enforcing code standards. It supports 30+ languages and integrates seamlessly into CI/CD pipelines.",
        "target_industries": ["Technology", "Financial Services", "Healthcare", "E-commerce", "SaaS", "Fintech"],
        "company_size_min": 100,
        "company_size_max": 10000,
        "target_locations": ["United States", "Canada", "United Kingdom", "Germany", "Australia"],
        "target_titles": [
            "VP of Engineering", "Director of Engineering", "Head of Engineering",
            "CISO", "Chief Information Security Officer", "VP of Security",
            "Director of Security", "Head of Security", "Security Engineering Manager",
            "Platform Engineering Lead", "DevOps Director", "Head of DevOps",
            "AppSec Manager", "Application Security Lead"
        ],
        "title_keywords": ["security", "engineering", "devops", "platform", "appsec", "devsecops", "infrastructure"],
        "exclude_titles": ["Intern", "Student", "Junior", "Entry Level", "Recruiter", "HR"],
        "target_seniority": ["VP", "Director", "Head", "C-Level", "Manager", "Lead"],
        "positive_signals": [
            "SAST", "static analysis", "code security", "DevSecOps", "shift left",
            "CI/CD security", "supply chain security", "SBOM", "vulnerability scanning",
            "code review automation", "security automation", "AppSec program"
        ],
        "negative_signals": ["competitor customer", "already using Snyk", "small team", "no security budget"],
        "tech_stack_positive": ["GitHub", "GitLab", "Jenkins", "CircleCI", "Kubernetes", "Docker", "AWS", "GCP", "Azure"],
        "tech_stack_negative": [],
        "trigger_events": [
            "recent funding round", "security incident in news", "hiring security engineers",
            "new CISO hired", "compliance requirement", "SOC 2 certification", "going public"
        ],
        "pain_points": [
            "Too many false positives from current SAST tools",
            "Slow scan times blocking CI/CD pipelines",
            "Difficulty getting developers to adopt security tools",
            "Lack of custom rule capabilities",
            "High cost of enterprise security tools",
            "Security team bottleneck in code reviews"
        ],
        "value_propositions": [
            "Find real bugs 10x faster with low false positive rate",
            "Developer-friendly tool that engineers actually want to use",
            "Write custom rules in minutes, not days",
            "Seamless CI/CD integration - scans complete in seconds",
            "Open source core with enterprise features",
            "Single tool for security, quality, and compliance"
        ],
        "messaging_tone": "professional",
        "avoid_phrases": ["synergy", "leverage", "circle back", "game-changer", "best-in-class", "revolutionary"],
        "custom_instructions": "Focus on the developer experience and speed. Emphasize that Semgrep is built by security researchers who understand that tools need to be fast and accurate to be adopted. Mention the open-source community if relevant."
    }


@router.get("/{icp_id}", response_model=ICPResponse)
async def get_icp_config(icp_id: int, db: Session = Depends(get_db)):
    icp = db.query(ICPConfig).filter(ICPConfig.id == icp_id).first()
    if not icp:
        raise HTTPException(status_code=404, detail="ICP configuration not found")
    return icp


@router.post("/", response_model=ICPResponse)
async def create_icp_config(
    data: ICPCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Check if this is the first ICP
    existing_count = db.query(ICPConfig).count()

    icp = ICPConfig(
        created_by=current_user.id,
        is_default=(existing_count == 0),  # First one is default
        **data.dict()
    )
    db.add(icp)
    db.commit()
    db.refresh(icp)
    return icp


@router.put("/{icp_id}", response_model=ICPResponse)
async def update_icp_config(icp_id: int, data: ICPUpdate, db: Session = Depends(get_db)):
    icp = db.query(ICPConfig).filter(ICPConfig.id == icp_id).first()
    if not icp:
        raise HTTPException(status_code=404, detail="ICP configuration not found")

    for key, value in data.dict(exclude_unset=True).items():
        setattr(icp, key, value)

    db.commit()
    db.refresh(icp)
    return icp


@router.delete("/{icp_id}")
async def delete_icp_config(icp_id: int, db: Session = Depends(get_db)):
    icp = db.query(ICPConfig).filter(ICPConfig.id == icp_id).first()
    if not icp:
        raise HTTPException(status_code=404, detail="ICP configuration not found")

    if icp.is_default:
        raise HTTPException(status_code=400, detail="Cannot delete default ICP configuration")

    icp.is_active = False
    db.commit()
    return {"message": "ICP configuration deleted"}


@router.post("/{icp_id}/set-default")
async def set_default_icp(icp_id: int, db: Session = Depends(get_db)):
    # Unset current default
    db.query(ICPConfig).filter(ICPConfig.is_default == True).update({"is_default": False})

    # Set new default
    icp = db.query(ICPConfig).filter(ICPConfig.id == icp_id).first()
    if not icp:
        raise HTTPException(status_code=404, detail="ICP configuration not found")

    icp.is_default = True
    db.commit()
    return {"message": "Default ICP updated"}


@router.post("/{icp_id}/duplicate", response_model=ICPResponse)
async def duplicate_icp(icp_id: int, db: Session = Depends(get_db)):
    original = db.query(ICPConfig).filter(ICPConfig.id == icp_id).first()
    if not original:
        raise HTTPException(status_code=404, detail="ICP configuration not found")

    new_icp = ICPConfig(
        name=f"{original.name} (Copy)",
        description=original.description,
        product_name=original.product_name,
        company_name=original.company_name,
        product_description=original.product_description,
        target_industries=original.target_industries,
        company_size_min=original.company_size_min,
        company_size_max=original.company_size_max,
        target_locations=original.target_locations,
        target_titles=original.target_titles,
        title_keywords=original.title_keywords,
        exclude_titles=original.exclude_titles,
        target_seniority=original.target_seniority,
        positive_signals=original.positive_signals,
        negative_signals=original.negative_signals,
        tech_stack_positive=original.tech_stack_positive,
        tech_stack_negative=original.tech_stack_negative,
        trigger_events=original.trigger_events,
        pain_points=original.pain_points,
        value_propositions=original.value_propositions,
        messaging_tone=original.messaging_tone,
        avoid_phrases=original.avoid_phrases,
        custom_instructions=original.custom_instructions,
        is_default=False
    )
    db.add(new_icp)
    db.commit()
    db.refresh(new_icp)
    return new_icp
