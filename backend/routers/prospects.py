from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
import csv
import io

from database import get_db
from models.prospect import Prospect, ProspectStatus
from models.company import Company
from models.icp import ICPConfig
from services.icp_scorer import ICPScorer

router = APIRouter(prefix="/api/prospects", tags=["prospects"], redirect_slashes=False)
def prospect_to_dict(p):
    return {
        "id": p.id,
        "first_name": p.first_name,
        "last_name": p.last_name,
        "full_name": p.full_name,
        "email": p.email,
        "phone": p.phone,
        "title": p.title,
        "company_name": p.company_name,
        "company_id": p.company_id,
        "linkedin_url": p.linkedin_url,
        "twitter_url": p.twitter_url,
        "status": p.status.value if p.status else "new",
        "source": p.source,
        "icp_score": p.icp_score or 0,
        "icp_match_reasons": p.icp_match_reasons or [],
        "research_summary": p.research_summary,
        "created_at": p.created_at.isoformat() if p.created_at else None,
    }




# Schemas
class ProspectCreate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    full_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    title: Optional[str] = None
    company_name: Optional[str] = None
    linkedin_url: Optional[str] = None
    twitter_url: Optional[str] = None


class ProspectUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    title: Optional[str] = None
    company_name: Optional[str] = None
    linkedin_url: Optional[str] = None
    twitter_url: Optional[str] = None
    status: Optional[ProspectStatus] = None


class ProspectResponse(BaseModel):
    id: int
    first_name: Optional[str]
    last_name: Optional[str]
    full_name: str
    email: Optional[str]
    phone: Optional[str]
    title: Optional[str]
    company_name: Optional[str]
    company_id: Optional[int]
    linkedin_url: Optional[str]
    twitter_url: Optional[str]
    status: ProspectStatus
    source: Optional[str]
    icp_score: int
    icp_match_reasons: List[str]
    research_summary: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# Routes
@router.get("", response_model=dict)
async def list_prospects(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    status: Optional[ProspectStatus] = None,
    search: Optional[str] = None,
    sort_by: str = "created_at",
    sort_order: str = "desc",
    db: Session = Depends(get_db)
):
    query = db.query(Prospect)

    # Filters
    if status:
        query = query.filter(Prospect.status == status)
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (Prospect.full_name.ilike(search_term)) |
            (Prospect.email.ilike(search_term)) |
            (Prospect.company_name.ilike(search_term))
        )

    # Sorting
    sort_column = getattr(Prospect, sort_by, Prospect.created_at)
    if sort_order == "desc":
        query = query.order_by(sort_column.desc())
    else:
        query = query.order_by(sort_column.asc())

    # Pagination
    total = query.count()
    prospects = query.offset((page - 1) * per_page).limit(per_page).all()

    return {
        "prospects": [prospect_to_dict(p) for p in prospects],
        "total": total,
        "page": page,
        "per_page": per_page,
        "pages": (total + per_page - 1) // per_page
    }


@router.get("/{prospect_id}", response_model=ProspectResponse)
async def get_prospect(prospect_id: int, db: Session = Depends(get_db)):
    prospect = db.query(Prospect).filter(Prospect.id == prospect_id).first()
    if not prospect:
        raise HTTPException(status_code=404, detail="Prospect not found")
    return prospect


@router.post("/", response_model=ProspectResponse)
async def create_prospect(data: ProspectCreate, db: Session = Depends(get_db)):
    # Create or find company
    company = None
    if data.company_name:
        company = db.query(Company).filter(Company.name == data.company_name).first()
        if not company:
            company = Company(name=data.company_name)
            db.add(company)
            db.flush()

    prospect = Prospect(
        first_name=data.first_name,
        last_name=data.last_name,
        full_name=data.full_name,
        email=data.email,
        phone=data.phone,
        title=data.title,
        company_name=data.company_name,
        company_id=company.id if company else None,
        linkedin_url=data.linkedin_url,
        twitter_url=data.twitter_url,
        source="manual"
    )
    db.add(prospect)
    db.commit()
    db.refresh(prospect)
    return prospect


@router.put("/{prospect_id}", response_model=ProspectResponse)
async def update_prospect(
    prospect_id: int,
    data: ProspectUpdate,
    db: Session = Depends(get_db)
):
    prospect = db.query(Prospect).filter(Prospect.id == prospect_id).first()
    if not prospect:
        raise HTTPException(status_code=404, detail="Prospect not found")

    for key, value in data.dict(exclude_unset=True).items():
        setattr(prospect, key, value)

    db.commit()
    db.refresh(prospect)
    return prospect


@router.delete("/{prospect_id}")
async def delete_prospect(prospect_id: int, db: Session = Depends(get_db)):
    prospect = db.query(Prospect).filter(Prospect.id == prospect_id).first()
    if not prospect:
        raise HTTPException(status_code=404, detail="Prospect not found")

    db.delete(prospect)
    db.commit()
    return {"message": "Prospect deleted"}


@router.post("/import/csv")
async def import_csv(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Import prospects from CSV file"""
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="File must be a CSV")

    content = await file.read()
    decoded = content.decode('utf-8')
    reader = csv.DictReader(io.StringIO(decoded))

    # Get active ICP for scoring
    icp_config = db.query(ICPConfig).filter(ICPConfig.is_default == True).first()
    scorer = ICPScorer(icp_config) if icp_config else None

    imported = 0
    skipped = 0
    prospects_created = []

    # Column name mapping (handle various formats)
    column_mappings = {
        'first_name': ['first_name', 'firstname', 'first name', 'First Name'],
        'last_name': ['last_name', 'lastname', 'last name', 'Last Name'],
        'full_name': ['full_name', 'fullname', 'full name', 'Full Name', 'name', 'Name'],
        'email': ['email', 'Email', 'email_address', 'Email Address'],
        'phone': ['phone', 'Phone', 'phone_number', 'Phone Number'],
        'title': ['title', 'Title', 'job_title', 'Job Title', 'position', 'Position'],
        'company': ['company', 'Company', 'company_name', 'Company Name', 'organization'],
        'linkedin_url': ['linkedin_url', 'linkedin', 'LinkedIn', 'LinkedIn URL'],
        'twitter_url': ['twitter_url', 'twitter', 'Twitter', 'Twitter URL'],
    }

    def get_value(row, field):
        for possible_name in column_mappings.get(field, []):
            if possible_name in row and row[possible_name]:
                return row[possible_name].strip()
        return None

    for row in reader:
        # Extract data
        first_name = get_value(row, 'first_name') or ''
        last_name = get_value(row, 'last_name') or ''
        full_name = get_value(row, 'full_name') or f"{first_name} {last_name}".strip()
        email = get_value(row, 'email')

        if not full_name and not email:
            skipped += 1
            continue

        # Check for duplicates
        if email:
            existing = db.query(Prospect).filter(Prospect.email == email).first()
            if existing:
                skipped += 1
                continue

        # Create or find company
        company_name = get_value(row, 'company')
        company = None
        if company_name:
            company = db.query(Company).filter(Company.name == company_name).first()
            if not company:
                company = Company(name=company_name)
                db.add(company)
                db.flush()

        # Create prospect
        prospect = Prospect(
            first_name=first_name or None,
            last_name=last_name or None,
            full_name=full_name,
            email=email,
            phone=get_value(row, 'phone'),
            title=get_value(row, 'title'),
            company_name=company_name,
            company_id=company.id if company else None,
            linkedin_url=get_value(row, 'linkedin_url'),
            twitter_url=get_value(row, 'twitter_url'),
            source="csv",
            status=ProspectStatus.NEW
        )
        db.add(prospect)
        db.flush()

        # Score against ICP if available
        if scorer:
            score_result = scorer.score_prospect(
                prospect_data={
                    "title": prospect.title,
                    "seniority": prospect.seniority,
                },
                company_data={
                    "name": company_name,
                    "industry": company.industry if company else None,
                    "employee_count": company.employee_count if company else None,
                },
                research_data={}
            )
            prospect.icp_score = score_result.get("total_score", 0)
            prospect.icp_match_reasons = score_result.get("match_reasons", [])

        prospects_created.append(prospect)
        imported += 1

    db.commit()

    return {
        "message": f"Import complete",
        "imported": imported,
        "skipped": skipped,
        "prospects": [{"id": p.id, "name": p.full_name, "icp_score": p.icp_score} for p in prospects_created[:10]]
    }
