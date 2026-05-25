import os
import io
from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Form, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import text
from dotenv import load_dotenv
import ai_service
import cloudinary_service
import models
import schemas
import security
from database import engine, get_db

load_dotenv()

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="ResourceBridge API")

raw_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173")
allowed_origins = [o.strip() for o in raw_origins.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

VALID_CATEGORIES = [
    "immigration", "school", "housing", "employment",
    "healthcare", "benefits", "emergency", "Uncategorized"
]


# ─── Health ────────────────────────────────────────────────────────────────────

@app.get("/")
def read_root():
    return {"status": "healthy", "project": "ResourceBridge"}


@app.get("/test-db")
def test_database_connection(db: Session = Depends(get_db)):
    try:
        result = db.execute(text("SELECT 1")).fetchone()
        if result[0] == 1:
            return {"database_status": "connected"}
    except Exception as e:
        return {"database_status": "error", "details": str(e)}


# ─── Auth ──────────────────────────────────────────────────────────────────────

@app.post("/register", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
def register_user(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(
        models.User.email == user_in.email).first()
    if existing:
        raise HTTPException(
            status_code=400, detail="Email is already registered.")
    hashed = security.get_password_hash(user_in.password)
    user = models.User(email=user_in.email, hashed_password=hashed)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@app.post("/login", response_model=schemas.Token)
def login_user(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(
        models.User.email == form_data.username).first()
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = security.create_access_token(data={"sub": user.email})
    return {"access_token": token, "token_type": "bearer"}


# ─── File Upload to Cloudinary ─────────────────────────────────────────────────

@app.post("/upload", response_model=schemas.UploadResponse)
async def upload_file(
    file: UploadFile = File(...),
    current_user: models.User = Depends(security.get_current_user)
):
    """
    Accepts a real file upload from the browser, stores it in Cloudinary,
    and returns the secure public URL to be used when creating a document record.
    """
    allowed_types = {
        "application/pdf", "image/png", "image/jpeg",
        "image/jpg", "image/webp", "image/gif"
    }
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail="Unsupported file type. Please upload a PDF or image file."
        )

    # Limit file size to 20MB
    file_bytes = await file.read()
    if len(file_bytes) > 20 * 1024 * 1024:
        raise HTTPException(
            status_code=400, detail="File too large. Maximum size is 20MB.")

    folder = f"resourcebridge/user_{current_user.id}"
    file_url = cloudinary_service.upload_file_to_cloudinary(
        file_bytes, file.filename or "document", folder=folder
    )

    return {"file_url": file_url, "original_filename": file.filename or "document"}


# ─── Documents ─────────────────────────────────────────────────────────────────

@app.post("/documents", response_model=schemas.DocumentResponse, status_code=201)
def create_document(
    doc_in: schemas.DocumentCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    """
    Creates a document record and triggers the full Gemini AI pipeline:
    OCR, English summary, Spanish summary, and action items extraction.
    """
    print(f"Processing document: {doc_in.title}")
    ai = ai_service.process_document_with_ai(doc_in.file_url)

    doc = models.Document(
        title=doc_in.title,
        file_url=doc_in.file_url,
        category=doc_in.category or "Uncategorized",
        ocr_text=ai["ocr_text"],
        ai_summary=ai["ai_summary"],
        ai_summary_es=ai["ai_summary_es"],
        action_items=ai["action_items"],
        is_emergency=doc_in.is_emergency,
        owner_id=current_user.id,
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc


@app.get("/documents", response_model=list[schemas.DocumentResponse])
def get_documents(
    category: str | None = Query(default=None),
    emergency_only: bool = Query(default=False),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    """
    Returns all documents for the authenticated user.
    Optionally filter by category or emergency flag.
    """
    query = db.query(models.Document).filter(
        models.Document.owner_id == current_user.id)
    if category and category != "All":
        query = query.filter(models.Document.category == category)
    if emergency_only:
        query = query.filter(models.Document.is_emergency == True)
    return query.order_by(models.Document.created_at.desc()).all()


@app.get("/documents/{doc_id}", response_model=schemas.DocumentResponse)
def get_document(
    doc_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    doc = db.query(models.Document).filter(
        models.Document.id == doc_id,
        models.Document.owner_id == current_user.id
    ).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")
    return doc


@app.delete("/documents/{doc_id}", status_code=204)
def delete_document(
    doc_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    doc = db.query(models.Document).filter(
        models.Document.id == doc_id,
        models.Document.owner_id == current_user.id
    ).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")
    db.delete(doc)
    db.commit()


# ─── Emergency Packet ──────────────────────────────────────────────────────────

@app.get("/emergency-packet")
def generate_emergency_packet(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    """
    Gathers all documents flagged as emergency and returns a structured
    emergency preparedness packet as JSON (frontend renders it as printable HTML).
    """
    docs = db.query(models.Document).filter(
        models.Document.owner_id == current_user.id,
        models.Document.is_emergency == True
    ).all()

    if not docs:
        raise HTTPException(
            status_code=404,
            detail="No emergency documents found. Mark documents as emergency when uploading."
        )

    packet = {
        "owner_email": current_user.email,
        "document_count": len(docs),
        "documents": [
            {
                "title": d.title,
                "category": d.category,
                "summary": d.ai_summary,
                "summary_es": d.ai_summary_es,
                "action_items": d.action_items or [],
                "file_url": d.file_url,
                "uploaded": d.created_at.isoformat() if d.created_at else None,
            }
            for d in docs
        ]
    }
    return packet
