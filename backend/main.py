from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel
from typing import Optional, List
import os
import pandas as pd
import time
from datetime import datetime
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from dotenv import load_dotenv

# Load environment variables from backend/.env for local development
load_dotenv()

import asyncio
from sqlalchemy.orm import Session
from sqlalchemy.exc import OperationalError
from jose import JWTError, jwt

from db import engine, get_db
from models import User, Audit
from auth import create_access_token, hash_password, verify_password
from agents.research_agent import LeadResearchAgent
from utils.pdf_generator import generate_pdf_report

app = FastAPI(
    title="Lead Magnet AI API",
    description="AI-powered technical lead generation platform",
    version="1.0.0"
)

# CORS Configuration
allowed_origins_raw = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:5173")
allowed_origins = [origin.strip() for origin in allowed_origins_raw.split(",") if origin.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize agent
agent = LeadResearchAgent()


@app.on_event("startup")
def _startup():
    # Keep it simple for this project: create tables at startup.
    from db import Base  # local import to avoid circulars
    Base.metadata.create_all(bind=engine)

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


def _get_jwt_secret() -> str:
    secret = os.getenv("JWT_SECRET")
    if not secret:
        raise HTTPException(status_code=500, detail="Server auth is not configured (JWT_SECRET missing).")
    return secret


from fastapi import Header  # noqa: E402


def get_current_user_from_header(
    db: Session = Depends(get_db),
    authorization: str | None = Header(default=None),
) -> User:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")

    token = authorization.split(" ", 1)[1].strip()
    try:
        payload = jwt.decode(token, _get_jwt_secret(), algorithms=["HS256"])
        subject = payload.get("sub")
        if not subject:
            raise HTTPException(status_code=401, detail="Invalid token")
        user_id = int(subject)
    except (JWTError, ValueError):
        raise HTTPException(status_code=401, detail="Invalid token")

    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found or inactive")
    return user


def get_optional_user_from_header(
    db: Session = Depends(get_db),
    authorization: str | None = Header(default=None),
) -> User | None:
    if not authorization or not authorization.lower().startswith("bearer "):
        return None

    token = authorization.split(" ", 1)[1].strip()
    try:
        payload = jwt.decode(token, _get_jwt_secret(), algorithms=["HS256"])
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
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}


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
    if len(password.encode("utf-8")) > 72:
        raise HTTPException(status_code=400, detail="Password must be at most 72 bytes (bcrypt limit)")

    existing = db.query(User).filter(User.email == email).first()
    if existing:
        raise HTTPException(status_code=409, detail="An account with this email already exists")

    user = User(
        email=email,
        full_name=full_name,
        password_hash=hash_password(password),
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(subject=str(user.id), expires_in_minutes=60 * 24 * 7)
    return AuthResponse(
        access_token=token,
        user={"id": user.id, "email": user.email, "full_name": user.full_name},
    )


@app.post("/api/auth/login", response_model=AuthResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    email = request.email.strip().lower()
    password = request.password

    if not email or not password:
        raise HTTPException(status_code=400, detail="Email and password are required")
    if len(password.encode("utf-8")) > 72:
        raise HTTPException(status_code=400, detail="Password must be at most 72 bytes (bcrypt limit)")

    user = db.query(User).filter(User.email == email).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not verify_password(password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token(subject=str(user.id), expires_in_minutes=60 * 24 * 7)
    return AuthResponse(
        access_token=token,
        user={"id": user.id, "email": user.email, "full_name": user.full_name},
    )


@app.get("/api/auth/me")
def me(current_user: User = Depends(get_current_user_from_header)):
    return {"id": current_user.id, "email": current_user.email, "full_name": current_user.full_name}


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



# Single Analysis Endpoint
@app.post("/api/analyze")
async def analyze_company(
    request: AnalysisRequest,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_optional_user_from_header),
):
    """
    Analyze a single company and generate technical audit + outreach email
    """
    try:
        # Determine agency name: Request > User Profile > Env Var
        agency_name = request.agency_name
        if not agency_name and current_user:
            agency_name = current_user.agency_name
        if not agency_name:
            agency_name = os.getenv("AGENCY_NAME", "Your IT Agency")

        # Run analysis
        result = agent.analyze_company(
            company_name=request.company_name,
            industry=request.industry,
            agency_name=agency_name,
            include_linkedin=request.include_linkedin,
            include_competitors=request.include_competitors,
            website=request.website
        )

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
                result = agent.analyze_company(
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
        tavily_key = os.getenv("TAVILY_API_KEY")
        groq_key = os.getenv("GROQ_API_KEY")

        if not tavily_key or not groq_key:
            raise HTTPException(status_code=500, detail="Missing API keys in server environment")

        agent = LeadResearchAgent()
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
    smtp_server = os.getenv("SMTP_SERVER")
    smtp_port = int(os.getenv("SMTP_PORT", 587))
    smtp_username = os.getenv("SMTP_USERNAME")
    smtp_password = os.getenv("SMTP_PASSWORD")

    if not smtp_server or not smtp_username or not smtp_password:
        raise HTTPException(status_code=500, detail="System SMTP not configured")

    try:
        msg = MIMEMultipart()
        # Use logged-in user info if available, otherwise fall back to SMTP account
        sender_name = current_user.full_name if current_user else "Lead Magnet"
        reply_to = current_user.email if current_user else smtp_username

        msg['From'] = f"{sender_name} <{smtp_username}>"
        msg['To'] = request.to_email
        msg['Subject'] = request.subject
        msg['Reply-To'] = reply_to

        msg.attach(MIMEText(request.body, 'plain'))

        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()
        server.login(smtp_username, smtp_password)
        server.send_message(msg)
        server.quit()

        return {"message": f"Email sent successfully to {request.to_email}"}
    except Exception as e:
        print(f"Email sending error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to send email: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8001,
        reload=False,
        log_level="info"
    )
