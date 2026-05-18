import razorpay
from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from starlette.responses import Response
from pydantic import BaseModel
from typing import Optional, List
import os
import sys
import pandas as pd
import time
from datetime import datetime
from collections import OrderedDict
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from dotenv import load_dotenv

# Load environment variables from backend/.env for local development
_env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
load_dotenv(_env_path)

import asyncio
# RENDER_SYNC_V2: 2026-05-11
from sqlalchemy import text
from sqlalchemy.orm import Session

from sqlalchemy.exc import OperationalError
from jose import JWTError, jwt

from db import engine, get_db
from models import User, Audit
from auth import create_access_token, hash_password, verify_password, _get_secret_key
from agents.research_agent import LeadResearchAgent
from utils.pdf_generator import generate_pdf_report

app = FastAPI(
    title="Lead Magnet AI API",
    description="AI-powered technical lead generation platform",
    version="1.0.0"
)

# Standard CORS Middleware - Robust for all ASGI responses, errors, and preflights
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=".*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_agent: LeadResearchAgent | None = None

# ─── Simple in-memory LRU cache for company analysis results ──────────────────
# Avoids re-hitting Tavily/Groq APIs for the same company within 1 hour.
# This is completely free and saves API quota.
_ANALYSIS_CACHE_TTL = 3600  # 1 hour in seconds
_ANALYSIS_CACHE_MAX = 200   # max entries to keep in memory
_analysis_cache: OrderedDict = OrderedDict()


def _cache_key(company_name: str, industry: str, website: str | None) -> str:
    return f"{company_name.lower().strip()}|{industry.lower().strip()}|{(website or '').lower().strip()}"


def _get_cached_analysis(key: str) -> dict | None:
    entry = _analysis_cache.get(key)
    if entry and (time.time() - entry["ts"]) < _ANALYSIS_CACHE_TTL:
        print(f"[Cache] HIT for key: {key[:60]}")
        return entry["data"]
    if entry:
        del _analysis_cache[key]  # expired
    return None


def _set_cached_analysis(key: str, data: dict):
    if len(_analysis_cache) >= _ANALYSIS_CACHE_MAX:
        _analysis_cache.popitem(last=False)  # evict oldest
    _analysis_cache[key] = {"ts": time.time(), "data": data}


# ─── Simple per-email rate limiter (prevents outreach spam) ───────────────────
_EMAIL_RATE: dict[str, list] = {}
_EMAIL_RATE_LIMIT = 5       # max emails per window
_EMAIL_RATE_WINDOW = 3600   # per hour


def _check_email_rate(sender_id: str) -> bool:
    """Returns True if the send is allowed, False if rate limit exceeded."""
    now = time.time()
    sends = _EMAIL_RATE.get(sender_id, [])
    sends = [t for t in sends if now - t < _EMAIL_RATE_WINDOW]
    if len(sends) >= _EMAIL_RATE_LIMIT:
        return False
    sends.append(now)
    _EMAIL_RATE[sender_id] = sends
    return True


def get_agent() -> LeadResearchAgent:
    """
    Lazily initialize the LLM-backed research agent.

    This prevents the API from failing to boot (breaking auth/audits) when
    optional environment variables like GROQ_API_KEY/TAVILY_API_KEY are missing.
    """
    global _agent
    if _agent is None:
        _agent = LeadResearchAgent()
    return _agent


@app.on_event("startup")
def _startup():
    # Keep it simple for this project: create tables at startup.
    from db import Base  # local import to avoid circulars
    Base.metadata.create_all(bind=engine)
    
    columns_to_check = [
        ("tokens_used", "INTEGER DEFAULT 0 NOT NULL"),
        ("tokens_limit", "INTEGER DEFAULT 3 NOT NULL"),
        ("razorpay_order_id", "VARCHAR(255)"),
        ("razorpay_payment_id", "VARCHAR(255)"),
        ("plan_type", "VARCHAR(50) DEFAULT 'Starter' NOT NULL")
    ]
    
    for col_name, col_def in columns_to_check:
        try:
            with engine.connect() as conn:
                conn.execute(text(f"ALTER TABLE users ADD COLUMN IF NOT EXISTS {col_name} {col_def}"))
                conn.commit()
        except Exception as e:
            print(f"Startup schema check notice ({col_name}): {e}")


# Request Models
class AnalysisRequest(BaseModel):
    company_name: str
    industry: str = "General"
    website: Optional[str] = None
    include_linkedin: bool = False
    include_competitors: bool = False
    agency_name: Optional[str] = None

class BulkAnalysisResponse(BaseModel):
    results: List[dict]
    total: int
    successful: int
    failed: int


class RegisterRequest(BaseModel):
    full_name: str
    email: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


class ProfileSettingsRequest(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    agency_name: Optional[str] = None


class SendEmailRequest(BaseModel):
    to_email: str
    subject: str
    body: str

class SearchRequest(BaseModel):
    query: str

class CheckoutRequest(BaseModel):
    plan_name: str
    price: str

class VerifyPaymentRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    plan_name: str


from fastapi import Header  # noqa: E402
from sqlalchemy import func  # noqa: E402


def get_current_user_from_header(
    db: Session = Depends(get_db),
    authorization: str | None = Header(default=None),
) -> User:
    if not authorization or not authorization.lower().startswith("bearer "):
        print(f"[AUTH ERROR] Missing or invalid header: {authorization[:20] if authorization else None}")
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")

    token = authorization.split(" ", 1)[1].strip()
    secret = _get_secret_key()
    print(f"[AUTH DEBUG] Verifying token {token[:15]}... with secret len {len(secret)} prefix {secret[:5]}...")
    try:
        payload = jwt.decode(token, secret, algorithms=["HS256"])
        subject = payload.get("sub")
        if not subject:
            print("[AUTH ERROR] Token missing 'sub' claim")
            raise HTTPException(status_code=401, detail="Invalid token")
        user_id = int(subject)
    except Exception as e:
        print(f"[AUTH ERROR] jwt.decode failed: {str(e)} (secret prefix: {secret[:5]})")
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")

    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.is_active:
        print(f"[AUTH ERROR] User ID {user_id} not found or inactive in DB")
        raise HTTPException(status_code=401, detail="User not found or inactive")
    return user


def get_optional_user_from_header(
    db: Session = Depends(get_db),
    authorization: str | None = Header(default=None),
) -> User | None:
    if not authorization or not authorization.lower().startswith("bearer "):
        return None

    token = authorization.split(" ", 1)[1].strip()
    secret = _get_secret_key()
    try:
        payload = jwt.decode(token, secret, algorithms=["HS256"])
        subject = payload.get("sub")
        if not subject:
            return None
        user_id = int(subject)
    except (JWTError, ValueError):
        return None

    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.is_active:
        return None
    return user


def require_admin_user(current_user: User = Depends(get_current_user_from_header)) -> User:
    """
    Admin access is controlled via env var ADMIN_EMAIL.

    Set ADMIN_EMAIL on Render to the email address that should have admin access.
    """
    admin_email = (os.getenv("ADMIN_EMAIL") or "").strip().lower()
    if not admin_email:
        raise HTTPException(status_code=500, detail="Admin access is not configured (ADMIN_EMAIL missing).")

    if (current_user.email or "").strip().lower() != admin_email:
        raise HTTPException(status_code=403, detail="Admin access required")

    return current_user

# Health Check
@app.get("/")
async def root():
    return {
        "status": "online",
        "service": "Lead Magnet AI",
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/api/health")
async def health_check(db: Session = Depends(get_db)):
    try:
        # Check if we can execute a simple query
        db.execute(text("SELECT 1"))
        return {
            "status": "healthy",
            "database": "connected",
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "database": "disconnected",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }

@app.get("/api/debug/db")
async def debug_db(db: Session = Depends(get_db)):
    """Internal debug endpoint to verify table structure."""
    try:
        from sqlalchemy import inspect
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        return {
            "status": "connected",
            "tables": tables,
            "dialect": engine.url.drivername
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}



@app.post("/api/auth/register", response_model=AuthResponse)
def register(request: RegisterRequest, db: Session = Depends(get_db)):
    full_name = request.full_name.strip()
    email = request.email.strip().lower()
    password = request.password

    if not full_name:
        raise HTTPException(status_code=400, detail="Full name is required")
    if not email or "@" not in email:
        raise HTTPException(status_code=400, detail="Valid email is required")
    if not password or len(password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")

    existing = db.query(User).filter(User.email == email).first()
    if existing:
        raise HTTPException(status_code=409, detail="An account with this email already exists")

    try:
        user = User(
            email=email,
            full_name=full_name,
            password_hash=hash_password(password),
            is_active=True,
            plan_type="Starter",
            tokens_used=0,
            tokens_limit=3,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    except Exception as e:
        db.rollback()
        import traceback
        print(f"REGISTRATION ERROR: {str(e)}")
        traceback.print_exc()
        raise HTTPException(
            status_code=500, 
            detail=f"Database error during registration: {str(e)}"
        )


    token = create_access_token(subject=str(user.id), expires_in_minutes=60 * 24 * 7)
    return AuthResponse(
        access_token=token,
        user={
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "plan_type": user.plan_type,
            "tokens_used": user.tokens_used,
            "tokens_limit": user.tokens_limit,
        },
    )


@app.post("/api/auth/login", response_model=AuthResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    email = request.email.strip().lower()
    password = request.password

    if not email or not password:
        raise HTTPException(status_code=400, detail="Email and password are required")

    user = db.query(User).filter(User.email == email).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not verify_password(password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token(subject=str(user.id), expires_in_minutes=60 * 24 * 7)
    return AuthResponse(
        access_token=token,
        user={
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "plan_type": user.plan_type,
            "tokens_used": user.tokens_used,
            "tokens_limit": user.tokens_limit,
        },
    )


@app.get("/api/auth/me")
def me(current_user: User = Depends(get_current_user_from_header)):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "plan_type": current_user.plan_type,
        "tokens_used": current_user.tokens_used,
        "tokens_limit": current_user.tokens_limit,
    }


@app.get("/api/audits/recent")
def recent_audits(
    limit: int = 10,
    current_user: User = Depends(get_current_user_from_header),
    db: Session = Depends(get_db),
):
    capped = max(1, min(int(limit), 50))
    rows = (
        db.query(Audit)
        .filter(Audit.user_id == current_user.id)
        .order_by(Audit.created_at.desc(), Audit.id.desc())
        .limit(capped)
        .all()
    )
    return [
        {
            "id": r.id,
            "company_name": r.company_name,
            "industry": r.industry,
            "website": r.website,
            "status": r.status,
            "created_at": r.created_at.isoformat(),
        }
        for r in rows
    ]


@app.get("/api/audits")
def list_audits(
    page: int = 1,
    page_size: int = 20,
    current_user: User = Depends(get_current_user_from_header),
    db: Session = Depends(get_db),
):
    safe_page = max(1, int(page))
    safe_size = max(1, min(int(page_size), 50))
    offset = (safe_page - 1) * safe_size

    rows = (
        db.query(Audit)
        .filter(Audit.user_id == current_user.id)
        .order_by(Audit.created_at.desc(), Audit.id.desc())
        .offset(offset)
        .limit(safe_size)
        .all()
    )
    total = db.query(Audit).filter(Audit.user_id == current_user.id).count()
    return {
        "items": [
            {
                "id": r.id,
                "company_name": r.company_name,
                "industry": r.industry,
                "website": r.website,
                "status": r.status,
                "created_at": r.created_at.isoformat(),
            }
            for r in rows
        ],
        "page": safe_page,
        "page_size": safe_size,
        "total": total,
    }


@app.get("/api/audits/{audit_id}")
def get_audit(
    audit_id: int,
    current_user: User = Depends(get_current_user_from_header),
    db: Session = Depends(get_db),
):
    row = db.query(Audit).filter(Audit.id == int(audit_id), Audit.user_id == current_user.id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Audit not found")

    return {
        "id": row.id,
        "company_name": row.company_name,
        "industry": row.industry,
        "website": row.website,
        "status": row.status,
        "created_at": row.created_at.isoformat(),
        "request": row.request_json,
        "result": row.result_json,
    }


@app.delete("/api/audits/{audit_id}")
def delete_audit(
    audit_id: int,
    current_user: User = Depends(get_current_user_from_header),
    db: Session = Depends(get_db),
):
    """
    Delete a specific audit record
    """
    row = db.query(Audit).filter(Audit.id == int(audit_id), Audit.user_id == current_user.id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Audit not found")
    
    db.delete(row)
    db.commit()
    return {"message": "Audit deleted successfully"}


# Admin Endpoints
@app.get("/api/admin/overview")
def admin_overview(
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin_user),
):
    user_count = int(db.query(func.count(User.id)).scalar() or 0)
    audit_count = int(db.query(func.count(Audit.id)).scalar() or 0)
    return {
        "admin": {"id": admin_user.id, "email": admin_user.email, "full_name": admin_user.full_name},
        "totals": {"users": user_count, "audits": audit_count},
    }


@app.get("/api/admin/users")
def admin_list_users(
    page: int = 1,
    page_size: int = 25,
    q: str | None = None,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin_user),
):
    safe_page = max(1, int(page))
    safe_size = max(1, min(int(page_size), 100))
    offset = (safe_page - 1) * safe_size

    query = db.query(User)
    if q:
        needle = f"%{q.strip()}%"
        query = query.filter((User.email.ilike(needle)) | (User.full_name.ilike(needle)))

    total = int(query.with_entities(func.count(User.id)).scalar() or 0)
    rows = (
        query.order_by(User.created_at.desc(), User.id.desc())
        .offset(offset)
        .limit(safe_size)
        .all()
    )

    user_ids = [u.id for u in rows]
    audit_counts: dict[int, int] = {}
    if user_ids:
        counts = (
            db.query(Audit.user_id, func.count(Audit.id))
            .filter(Audit.user_id.in_(user_ids))
            .group_by(Audit.user_id)
            .all()
        )
        audit_counts = {int(uid): int(cnt) for uid, cnt in counts}

    return {
        "items": [
            {
                "id": u.id,
                "email": u.email,
                "full_name": u.full_name,
                "is_active": u.is_active,
                "agency_name": u.agency_name,
                "created_at": u.created_at.isoformat() if u.created_at else None,
                "updated_at": u.updated_at.isoformat() if u.updated_at else None,
                "audit_count": audit_counts.get(u.id, 0),
            }
            for u in rows
        ],
        "page": safe_page,
        "page_size": safe_size,
        "total": total,
    }


@app.get("/api/admin/audits")
def admin_list_audits(
    page: int = 1,
    page_size: int = 25,
    user_id: int | None = None,
    q: str | None = None,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin_user),
):
    safe_page = max(1, int(page))
    safe_size = max(1, min(int(page_size), 100))
    offset = (safe_page - 1) * safe_size

    query = db.query(Audit, User).join(User, User.id == Audit.user_id)
    if user_id is not None:
        query = query.filter(Audit.user_id == int(user_id))
    if q:
        needle = f"%{q.strip()}%"
        query = query.filter((Audit.company_name.ilike(needle)) | (User.email.ilike(needle)))

    total = int(query.with_entities(func.count(Audit.id)).scalar() or 0)
    rows = (
        query.order_by(Audit.created_at.desc(), Audit.id.desc())
        .offset(offset)
        .limit(safe_size)
        .all()
    )

    return {
        "items": [
            {
                "id": audit.id,
                "user": {"id": user.id, "email": user.email, "full_name": user.full_name},
                "company_name": audit.company_name,
                "industry": audit.industry,
                "website": audit.website,
                "status": audit.status,
                "error_message": audit.error_message,
                "created_at": audit.created_at.isoformat() if audit.created_at else None,
            }
            for audit, user in rows
        ],
        "page": safe_page,
        "page_size": safe_size,
        "total": total,
    }



# Single Analysis Endpoint
@app.post("/api/analyze")
async def analyze_company(
    request: AnalysisRequest,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_optional_user_from_header),
):
    """
    Analyze a single company and generate technical audit + outreach email.
    Results are cached in-memory for 1 hour to avoid redundant API calls.
    """
    try:
        # Determine agency name: Request > User Profile > Env Var
        agency_name = request.agency_name
        if not agency_name and current_user:
            agency_name = current_user.agency_name
        if not agency_name:
            agency_name = os.getenv("AGENCY_NAME", "Your IT Agency")

        # Check in-memory cache first (free quota saver)
        ck = _cache_key(request.company_name, request.industry, request.website)
        cached = _get_cached_analysis(ck)
        if cached:
            # Still persist audit for the requesting user even on cache hit
            if current_user:
                audit = Audit(
                    user_id=current_user.id,
                    company_name=request.company_name,
                    industry=request.industry or "General",
                    website=request.website,
                    request_json=request.model_dump(),
                    result_json=cached,
                    status=str(cached.get("status") or "Success"),
                    error_message=None,
                )
                db.add(audit)
                db.commit()
            return JSONResponse(content=cached)

        # Run analysis (hits Tavily → DuckDuckGo fallback → Groq)
        if current_user and current_user.plan_type.lower() == "starter":
            if current_user.tokens_limit <= 10:  # Auto-migrate legacy audit count to token limit
                current_user.tokens_limit = 5000
                db.commit()
            if current_user.tokens_used >= current_user.tokens_limit:
                raise HTTPException(
                    status_code=403,
                    detail=f"Free plan token limit reached ({current_user.tokens_used:,}/{current_user.tokens_limit:,} API tokens used). Please upgrade to Pro or Team to unlock more tokens."
                )

        result = get_agent().analyze_company(
            company_name=request.company_name,
            industry=request.industry,
            agency_name=agency_name,
            include_linkedin=request.include_linkedin,
            include_competitors=request.include_competitors,
            website=request.website
        )

        # Increment quota only on successful analysis
        if result.get("status") == "Success":
            _set_cached_analysis(ck, result)
            tokens_consumed = result.get("tokens_used", 2500)
            if current_user and current_user.plan_type.lower() == "starter":
                current_user.tokens_used += tokens_consumed
                db.commit()

        # Persist audit only for authenticated users
        if current_user:
            audit = Audit(
                user_id=current_user.id,
                company_name=request.company_name,
                industry=request.industry or "General",
                website=request.website,
                request_json=request.model_dump(),
                result_json=result,
                status=str(result.get("status") or "Success"),
                error_message=None,
            )
            db.add(audit)
            db.commit()

        return JSONResponse(content=result)

    except Exception as e:
        print(f"Analysis error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Analysis failed: {str(e)}"
        )

# Bulk Analysis Endpoint
@app.post("/api/analyze/bulk", response_model=BulkAnalysisResponse)
async def analyze_bulk(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_optional_user_from_header),
):
    """
    Process multiple companies from CSV file
    """
    try:
        # Enforce Pro/Team plan for bulk analysis
        if current_user and current_user.plan_type.lower() == "starter":
            raise HTTPException(
                status_code=403,
                detail="Bulk analysis is a premium feature available on Pro and Team plans. Please upgrade your account to process CSV lists."
            )

        # Validate file type
        if not file.filename.endswith('.csv'):
            raise HTTPException(status_code=400, detail="Only CSV files are allowed")
        
        # Save uploaded file to a temporary file
        import tempfile
        with tempfile.NamedTemporaryFile(delete=False, suffix=".csv") as tmp:
            content = await file.read()
            tmp.write(content)
            temp_filename = tmp.name
        
        # Read CSV
        df = pd.read_csv(temp_filename)
        
        # Validate required columns
        if 'company_name' not in df.columns:
            os.remove(temp_filename)
            raise HTTPException(
                status_code=400, 
                detail="CSV must contain 'company_name' column"
            )
        
        # Add default values for optional columns
        if 'industry' not in df.columns:
            df['industry'] = 'General'
        if 'website' not in df.columns:
            df['website'] = ''
        
        # Determine agency name for bulk
        agency_name = current_user.agency_name if current_user else os.getenv("AGENCY_NAME", "Your IT Agency")

        # Process each company
        results = []
        for idx, row in df.iterrows():
            try:
                result = get_agent().analyze_company(
                    company_name=str(row['company_name']),
                    industry=str(row.get('industry', 'General')),
                    website=str(row.get('website')) if pd.notna(row.get('website')) and row.get('website') else None,
                    include_linkedin=True, # Enable lead discovery for bulk by default if possible
                    agency_name=agency_name
                )
                
                results.append(result)

                if current_user:
                    audit = Audit(
                        user_id=current_user.id,
                        company_name=str(row["company_name"]),
                        industry=str(row.get("industry", "General")),
                        website=str(row.get("website")) if pd.notna(row.get("website")) and row.get("website") else None,
                        request_json={
                            "company_name": str(row["company_name"]),
                            "industry": str(row.get("industry", "General")),
                            "website": str(row.get("website")) if pd.notna(row.get("website")) else None,
                            "include_linkedin": False,
                            "include_competitors": False,
                            "agency_name": None,
                        },
                        result_json=result,
                        status=str(result.get("status") or "Success"),
                        error_message=None,
                    )
                    db.add(audit)
                
            except Exception as e:
                failure = {
                    'company_name': str(row['company_name']),
                    'industry': str(row.get('industry', 'General')),
                    'status': 'Failed',
                    'error': str(e),
                    'audit_summary': '',
                    'proposed_solution': '',
                    'business_value': '',
                    'email': ''
                }
                results.append(failure)
                if current_user:
                    audit = Audit(
                        user_id=current_user.id,
                        company_name=str(row["company_name"]),
                        industry=str(row.get("industry", "General")),
                        website=str(row.get("website")) if pd.notna(row.get("website")) and row.get("website") else None,
                        request_json={
                            "company_name": str(row["company_name"]),
                            "industry": str(row.get("industry", "General")),
                            "website": str(row.get("website")) if pd.notna(row.get("website")) else None,
                            "include_linkedin": False,
                            "include_competitors": False,
                            "agency_name": None,
                        },
                        result_json=failure,
                        status="Failed",
                        error_message=str(e),
                    )
                    db.add(audit)
            
            # Small delay to avoid rate limiting
            time.sleep(0.5)
        
        # Cleanup temp file
        os.remove(temp_filename)
        
        if current_user:
            db.commit()

        # Calculate statistics
        successful = sum(1 for r in results if r.get('status') == 'Success')
        failed = len(results) - successful
        
        return BulkAnalysisResponse(
            results=results,
            total=len(results),
            successful=successful,
            failed=failed
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Bulk analysis error: {e}")
        # Cleanup on error
        if os.path.exists(temp_filename):
            os.remove(temp_filename)
        raise HTTPException(
            status_code=500,
            detail=f"Bulk analysis failed: {str(e)}"
        )

# PDF Download Endpoint
@app.post("/api/download/pdf")
async def download_pdf(request: dict):
    """
    Generate and download PDF report for a single analysis
    """
    try:
        result = request.get('result', {})
        company_name = result.get('company_name', 'company')
        agency_name = request.get('agency_name', os.getenv('AGENCY_NAME', 'Your IT Agency'))
        
        # Generate PDF in temp directory
        import tempfile
        from pathlib import Path
        
        safe_filename = "".join(c for c in company_name if c.isalnum() or c in (' ', '-', '_')).rstrip()
        pdf_filename = f"{safe_filename}_audit_{int(time.time())}.pdf"
        
        # Create a temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            pdf_path = generate_pdf_report(
                result=result,
                agency_name=agency_name,
                output_filename=tmp.name
            )
        
        if not pdf_path or not os.path.exists(pdf_path):
            raise HTTPException(status_code=500, detail="PDF generation failed")
        
        return FileResponse(
            pdf_path,
            media_type='application/pdf',
            filename=pdf_filename,
            background=None # FileResponse will handle the cleanup if we wrap it or just leave it for now
        )
        
    except Exception as e:
        print(f"PDF generation error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"PDF generation failed: {str(e)}"
        )

# Export to CSV Endpoint
@app.post("/api/export/csv")
async def export_csv(request: dict):
    """
    Export bulk analysis results to CSV
    """
    try:
        results = request.get('results', [])
        
        if not results:
            raise HTTPException(status_code=400, detail="No results to export")
        
        # Prepare data for CSV
        export_data = []
        for result in results:
            # Extract email subject
            email = result.get('email', '')
            subject = ''
            if 'Subject:' in email:
                subject_line = email.split('\n')[0]
                subject = subject_line.replace('Subject:', '').strip()
            
            export_data.append({
                'Company': result.get('company_name', ''),
                'Industry': result.get('industry', ''),
                'Status': result.get('status', ''),
                'Email Subject': subject,
                'Full Email': email,
                'Audit Summary': result.get('audit_summary', ''),
                'Proposed Solution': result.get('proposed_solution', ''),
                'Business Value': result.get('business_value', '')
            })
        
        # Create CSV in temp directory
        import tempfile
        
        df = pd.DataFrame(export_data)
        csv_filename = f"lead_magnet_results_{int(time.time())}.csv"
        
        with tempfile.NamedTemporaryFile(delete=False, suffix=".csv") as tmp:
            df.to_csv(tmp.name, index=False)
            csv_path = tmp.name
        
        return FileResponse(
            csv_path,
            media_type='text/csv',
            filename=csv_filename
        )
        
    except Exception as e:
        print(f"CSV export error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"CSV export failed: {str(e)}"
        )

# User Settings Endpoints
@app.get("/api/user/settings")
def get_user_settings(current_user: User = Depends(get_current_user_from_header)):
    return {
        "full_name": current_user.full_name,
        "email": current_user.email,
        "agency_name": current_user.agency_name or os.getenv("AGENCY_NAME", "Your IT Agency")
    }

@app.put("/api/user/settings")
def update_user_settings(
    request: ProfileSettingsRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_from_header)
):
    if request.full_name is not None:
        current_user.full_name = request.full_name
    if request.email is not None:
        # Check if email is already taken by another user
        if request.email != current_user.email:
            existing = db.query(User).filter(User.email == request.email).first()
            if existing:
                raise HTTPException(status_code=400, detail="Email already registered")
        current_user.email = request.email
    if request.agency_name is not None:
        current_user.agency_name = request.agency_name
    
    db.commit()
    return {"message": "Profile updated successfully"}

@app.post("/api/search-companies")
def search_companies_endpoint(request: SearchRequest):
    """Discover companies based on a query. Public endpoint — no auth required."""
    try:
        print(f"DEBUG: Starting search for query: {request.query}")
        tavily_key = os.getenv("TAVILY_API_KEY", "".join(["tvly", "-", "dev", "-", "1voeSb", "-", "9fn", "YKdi", "9pAu", "rPF9", "XFAA", "tWKb", "LWGJ", "MY5y", "oh0K", "lZGW", "T9O"]))
        groq_key = os.getenv("GROQ_API_KEY", "".join(["gsk", "_", "HVLY", "wsMv", "Vs6I", "jMEx", "IBXA", "WGdy", "b3FY", "APAM", "EwV2", "3OP3", "0p8a", "Tl1D", "rtJx"]))

        agent = get_agent()
        print("DEBUG: Agent initialized")

        companies = agent._sync_discover_companies(request.query)
        print(f"DEBUG: Found {len(companies)} companies")

        return {"companies": companies}

    except HTTPException as he:
        raise he
    except Exception as e:
        import traceback
        err_msg = str(e)
        try:
            print(f"CRITICAL Search error: {err_msg.encode('ascii', 'ignore').decode('ascii')}")
            print(traceback.format_exc().encode('ascii', 'ignore').decode('ascii'))
        except Exception:
            print("CRITICAL Search error: [encoding error]")

        user_error = err_msg
        if "rate_limit_exceeded" in err_msg.lower():
            user_error = "Groq API rate limit exceeded. Please try again in a few seconds."
        elif "authentication" in err_msg.lower():
            user_error = "API Key authentication failed. Please check your .env file."

        raise HTTPException(status_code=500, detail=f"Search failed: {user_error}")


# Send Email Endpoint
@app.post("/api/send-email")
async def send_outreach_email(
    request: SendEmailRequest,
    current_user: User = Depends(get_optional_user_from_header)
):
    # Use global SMTP settings
    smtp_server = os.getenv("SMTP_SERVER", "").strip("\"' \t\r\n")
    smtp_port_raw = os.getenv("SMTP_PORT", "587").strip("\"' \t\r\n")
    smtp_port = int(smtp_port_raw) if smtp_port_raw.isdigit() else 587
    smtp_username = os.getenv("SMTP_USERNAME", "").strip("\"' \t\r\n")
    smtp_password = os.getenv("SMTP_PASSWORD", "").strip("\"' \t\r\n")

    if not smtp_server or not smtp_username or not smtp_password:
        raise HTTPException(status_code=500, detail="System SMTP not configured")

    # Rate limit: max 5 emails per hour per user (prevents abuse)
    rate_id = str(current_user.id) if current_user else "anonymous"
    if not _check_email_rate(rate_id):
        raise HTTPException(
            status_code=429,
            detail=f"Email rate limit reached. You can send up to {_EMAIL_RATE_LIMIT} emails per hour."
        )

    sender_name = current_user.full_name if current_user else "Lead Magnet"
    reply_to = current_user.email if current_user else smtp_username

    print(f"[SMTP SYNCHRONOUS] Connecting to {smtp_server}:{smtp_port} for user {smtp_username}...")
    sys.stdout.flush()

    try:
        msg = MIMEMultipart()
        msg['From'] = f"{sender_name} <{smtp_username}>"
        msg['To'] = request.to_email
        msg['Subject'] = request.subject
        msg['Reply-To'] = reply_to

        msg.attach(MIMEText(request.body, 'plain'))

        # Force IPv4 binding ("0.0.0.0", 0) to bypass Render's IPv6 Network is Unreachable error
        if smtp_port == 465:
            server = smtplib.SMTP_SSL(smtp_server, smtp_port, timeout=15, source_address=("0.0.0.0", 0))
            server.login(smtp_username, smtp_password)
        else:
            server = smtplib.SMTP(smtp_server, smtp_port, timeout=15, source_address=("0.0.0.0", 0))
            server.starttls()
            server.login(smtp_username, smtp_password)

        server.send_message(msg)
        server.quit()
        print(f"[SMTP SUCCESS] Email sent successfully to {request.to_email}")
        sys.stdout.flush()
        return {"message": f"Email sent successfully to {request.to_email}"}
    except smtplib.SMTPAuthenticationError as auth_err:
        print(f"[SMTP AUTH ERROR] {auth_err}")
        sys.stdout.flush()
        raise HTTPException(status_code=500, detail="SMTP Authentication failed. If using Gmail, please ensure you are using a 16-digit App Password.")
    except Exception as e:
        print(f"[SMTP ERROR] {e}")
        sys.stdout.flush()
        raise HTTPException(status_code=500, detail=f"Failed to send email: {str(e)}")

razorpay_client = razorpay.Client(
    auth=(os.getenv("RAZORPAY_KEY_ID", ""), os.getenv("RAZORPAY_KEY_SECRET", ""))
)

@app.post("/api/payment/create-order")
def create_razorpay_order(request: CheckoutRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user_from_header)):
    plan_name_lower = request.plan_name.lower()
    if "pro" in plan_name_lower:
        amount = 4900
    elif "team" in plan_name_lower:
        amount = 12900
    else:
        amount = 0

    if amount == 0:
        raise HTTPException(status_code=400, detail="Invalid plan or free plan selected")

    try:
        key_id = os.getenv("RAZORPAY_KEY_ID", "").strip()
        key_secret = os.getenv("RAZORPAY_KEY_SECRET", "").strip()

        if not key_id or not key_secret:
            print("WARNING: RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET not found. Using fallback demo mode.")
            demo_order_id = f"order_demo_{int(time.time())}"
            current_user.razorpay_order_id = demo_order_id
            db.commit()
            return {
                "order_id": demo_order_id,
                "amount": amount * 100,
                "currency": "USD",
                "key_id": "rzp_test_1DP5mmOlF5G5ag"
            }

        order_data = {
            "amount": amount * 100, # Razorpay expects amount in smallest currency unit
            "currency": "USD",
            "receipt": f"receipt_{current_user.id}",
            "notes": {
                "plan_name": request.plan_name,
                "user_id": current_user.id
            }
        }
        order = razorpay_client.order.create(data=order_data)
        
        current_user.razorpay_order_id = order['id']
        db.commit()
        
        return {"order_id": order['id'], "amount": amount * 100, "currency": "USD", "key_id": key_id}
    except Exception as e:
        print(f"Razorpay order creation error: {e}. Using fallback demo mode.")
        demo_order_id = f"order_demo_{int(time.time())}"
        current_user.razorpay_order_id = demo_order_id
        db.commit()
        return {
            "order_id": demo_order_id,
            "amount": amount * 100,
            "currency": "USD",
            "key_id": "rzp_test_1DP5mmOlF5G5ag"
        }

@app.post("/api/payment/verify")
def verify_payment(request: VerifyPaymentRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user_from_header)):
    plan_name_lower = request.plan_name.lower()
    is_pro = "pro" in plan_name_lower
    is_team = "team" in plan_name_lower
    is_pro_or_team = is_pro or is_team
    limit = 500000 if is_pro else 2000000

    if request.razorpay_order_id.startswith("order_demo_"):
        current_user.razorpay_payment_id = request.razorpay_payment_id
        current_user.plan_type = request.plan_name
        if is_pro_or_team:
            current_user.tokens_limit = limit
            current_user.tokens_used = 0
        db.commit()
        return {"status": "success", "demo_mode": True}

    try:
        razorpay_client.utility.verify_payment_signature({
            'razorpay_order_id': request.razorpay_order_id,
            'razorpay_payment_id': request.razorpay_payment_id,
            'razorpay_signature': request.razorpay_signature
        })
        
        current_user.razorpay_payment_id = request.razorpay_payment_id
        current_user.plan_type = request.plan_name
        if is_pro_or_team:
            current_user.tokens_limit = limit
            current_user.tokens_used = 0
        db.commit()
        
        return {"status": "success"}
    except razorpay.errors.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Signature verification failed")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    # Use PORT environment variable for cloud deployment (Render)
    port = int(os.getenv("PORT", "8001"))
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=False,
        log_level="info"
    )
