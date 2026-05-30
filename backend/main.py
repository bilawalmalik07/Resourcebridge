import time
import os
import io
import requests as req
from pathlib import Path
from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import text
from dotenv import load_dotenv
import ai_service
import cloudinary_service
import email_service
import reminder_scheduler
import models
import schemas
import security
from database import engine, get_db

load_dotenv()

models.Base.metadata.create_all(bind=engine)

_pending: dict = {}
CODE_TTL = 600  # 10 minutes

app = FastAPI(title="ResourceBridge API")

reminder_scheduler.start_scheduler()

raw_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173")
allowed_origins = [o.strip() for o in raw_origins.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Health ────────────────────────────────────────────────────────────────────

@app.get("/api/health")
def read_root():
    return {"status": "healthy", "project": "ResourceBridge"}


@app.get("/api/test-db")
def test_database_connection(db: Session = Depends(get_db)):
    try:
        result = db.execute(text("SELECT 1")).fetchone()
        if result[0] == 1:
            return {"database_status": "connected"}
    except Exception as e:
        return {"database_status": "error", "details": str(e)}


# ─── Auth ──────────────────────────────────────────────────────────────────────

@app.post("/api/send-verification")
def send_verification(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    import re
    u = user_in.username
    if len(u) < 8:
        raise HTTPException(
            status_code=400, detail="Username must be at least 8 characters.")
    if " " in u:
        raise HTTPException(
            status_code=400, detail="Username cannot contain spaces.")
    if not re.search(r'[!@#$%^&*()\-_=+\[\]{};:\'",.<>/?\\|]', u):
        raise HTTPException(
            status_code=400, detail="Username must include at least one symbol.")
    p = user_in.password
    if len(p) < 8:
        raise HTTPException(
            status_code=400, detail="Password must be at least 8 characters.")
    if " " in p:
        raise HTTPException(
            status_code=400, detail="Password cannot contain spaces.")
    if not user_in.email:
        raise HTTPException(status_code=400, detail="Email is required.")
    if db.query(models.User).filter(models.User.username == user_in.username).first():
        raise HTTPException(
            status_code=400, detail="Username is already taken.")
    if db.query(models.User).filter(models.User.email == user_in.email).first():
        raise HTTPException(
            status_code=400, detail="Email is already registered.")

    code = email_service.generate_code()
    hashed = security.get_password_hash(user_in.password)
    _pending[user_in.email] = {
        "code": code,
        "expires_at": time.time() + CODE_TTL,
        "username": user_in.username,
        "hashed_password": hashed,
    }
    sent = email_service.send_verification_email(
        user_in.email, code, user_in.username)
    if not sent:
        raise HTTPException(
            status_code=500, detail="Failed to send verification email. Please try again.")
    return {"message": "Verification code sent. Check your email."}


@app.post("/api/verify-and-register", response_model=schemas.UserResponse, status_code=201)
def verify_and_register(payload: schemas.VerifyCode, db: Session = Depends(get_db)):
    entry = _pending.get(payload.email)
    if not entry:
        raise HTTPException(
            status_code=400, detail="No pending verification for this email.")
    if time.time() > entry["expires_at"]:
        del _pending[payload.email]
        raise HTTPException(
            status_code=400, detail="Code expired. Please sign up again.")
    if entry["code"] != payload.code.strip():
        raise HTTPException(
            status_code=400, detail="Incorrect code. Please try again.")

    user = models.User(
        username=entry["username"],
        email=payload.email,
        hashed_password=entry["hashed_password"],
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    del _pending[payload.email]
    return user


@app.post("/api/login", response_model=schemas.Token)
def login_user(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(
        models.User.username == form_data.username).first()
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = security.create_access_token(data={"sub": user.username})
    return {"access_token": token, "token_type": "bearer"}


# ─── File Upload ───────────────────────────────────────────────────────────────

@app.post("/api/upload", response_model=schemas.UploadResponse)
async def upload_file(
    file: UploadFile = File(...),
    current_user: models.User = Depends(security.get_current_user)
):
    allowed_types = {
        "image/png", "image/jpeg", "image/jpg", "image/webp",
        "image/gif", "image/heic", "image/heif", "image/tiff", "image/bmp",
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-powerpoint",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "text/plain", "text/csv", "text/rtf",
        "application/vnd.oasis.opendocument.text",
        "application/vnd.oasis.opendocument.spreadsheet",
        "application/vnd.oasis.opendocument.presentation",
    }
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Unsupported file type.")
    file_bytes = await file.read()
    if len(file_bytes) > 20 * 1024 * 1024:
        raise HTTPException(
            status_code=400, detail="File too large. Maximum 20MB.")
    folder = f"resourcebridge/user_{current_user.id}"
    original_filename = file.filename or "document"

    file_url = cloudinary_service.upload_file_to_cloudinary(
        file_bytes, original_filename, folder=folder
    )
    ai_result = ai_service.process_document_from_bytes(
        file_bytes, original_filename)

    return {
        "file_url": file_url,
        "original_filename": original_filename,
        "ai_result": ai_result,
    }


# ─── Documents ─────────────────────────────────────────────────────────────────

@app.post("/api/documents", response_model=schemas.DocumentResponse, status_code=201)
def create_document(
    doc_in: schemas.DocumentCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    print(f"Saving: {doc_in.title}")
    ai = doc_in.ai_result or {
        "ocr_text": "Document saved. Re-upload to process with AI.",
        "ai_summary": "Document saved. Re-upload to process with AI.",
        "ai_summary_es": "Documento guardado. Vuelva a subir para procesar con IA.",
        "action_items": [],
    }
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


@app.get("/api/documents", response_model=list[schemas.DocumentResponse])
def get_documents(
    category: str | None = Query(default=None),
    emergency_only: bool = Query(default=False),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    query = db.query(models.Document).filter(
        models.Document.owner_id == current_user.id)
    if category and category != "All":
        query = query.filter(models.Document.category == category)
    if emergency_only:
        query = query.filter(models.Document.is_emergency == True)
    return query.order_by(models.Document.created_at.desc()).all()


@app.get("/api/documents/{doc_id}", response_model=schemas.DocumentResponse)
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


@app.patch("/api/documents/{doc_id}/emergency", response_model=schemas.DocumentResponse)
def toggle_emergency(
    doc_id: int,
    payload: schemas.EmergencyUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    doc = db.query(models.Document).filter(
        models.Document.id == doc_id,
        models.Document.owner_id == current_user.id
    ).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")
    doc.is_emergency = payload.is_emergency
    db.commit()
    db.refresh(doc)
    return doc


@app.delete("/api/documents/{doc_id}", status_code=204)
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


# ─── View URL + File Proxy (all file types) ────────────────────────────────────

MIME_MAP = {
    ".pdf":  "application/pdf",
    ".png":  "image/png",
    ".jpg":  "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".gif":  "image/gif",
    ".tiff": "image/tiff",
    ".tif":  "image/tiff",
    ".bmp":  "image/bmp",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".doc":  "application/msword",
    ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ".xls":  "application/vnd.ms-excel",
    ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ".ppt":  "application/vnd.ms-powerpoint",
    ".txt":  "text/plain",
    ".csv":  "text/csv",
}

INLINE_EXTS = {".pdf", ".png", ".jpg", ".jpeg",
               ".webp", ".gif", ".tiff", ".tif", ".bmp"}


@app.get("/api/documents/{doc_id}/view-url")
def get_view_url(
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

    # All file types go through our proxy — proven reliable for both PDFs and images
    token = security.create_access_token(data={"sub": current_user.username})
    base = os.getenv("APP_BASE_URL", "").rstrip("/")
    return {"url": f"{base}/api/documents/{doc_id}/proxy-file?token={token}"}


@app.get("/api/documents/{doc_id}/proxy-file")
def proxy_file(
    doc_id: int,
    token: str,
    db: Session = Depends(get_db),
):
    """Stream any file type through our server with correct Content-Type and Content-Disposition."""
    import re
    current_user = security.get_current_user(token=token, db=db)

    doc = db.query(models.Document).filter(
        models.Document.id == doc_id,
        models.Document.owner_id == current_user.id
    ).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    signed_url = cloudinary_service.get_signed_download_url(doc.file_url)
    try:
        resp = req.get(signed_url, timeout=60)
        resp.raise_for_status()
    except Exception as e:
        raise HTTPException(
            status_code=502, detail=f"Could not fetch file: {e}")

    url_path = doc.file_url.split("?")[0]
    ext = Path(url_path).suffix.lower()
    content_type = MIME_MAP.get(ext, resp.headers.get(
        "Content-Type", "application/octet-stream"))

    raw_name = url_path.split("/")[-1]
    clean_name = re.sub(
        r"_[a-zA-Z0-9]{6,}(\.[^.]+)$", r"\1", raw_name) if ext else raw_name

    disposition = f'inline; filename="{clean_name}"' if ext in INLINE_EXTS else f'attachment; filename="{clean_name}"'

    return StreamingResponse(
        io.BytesIO(resp.content),
        media_type=content_type,
        headers={"Content-Disposition": disposition},
    )


# ─── Reminders ─────────────────────────────────────────────────────────────────

@app.post("/api/reminders", response_model=schemas.ReminderResponse, status_code=201)
def create_reminder(
    r_in: schemas.ReminderCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    from datetime import datetime, timezone as tz
    remind_at = r_in.remind_at
    if remind_at.tzinfo is None:
        remind_at = remind_at.replace(tzinfo=tz.utc)
    if remind_at <= datetime.now(tz.utc):
        raise HTTPException(
            status_code=400, detail="Reminder time must be in the future.")
    reminder = models.Reminder(
        text=r_in.text,
        remind_at=remind_at,
        owner_id=current_user.id,
    )
    db.add(reminder)
    db.commit()
    db.refresh(reminder)
    return reminder


@app.get("/api/reminders", response_model=list[schemas.ReminderResponse])
def get_reminders(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    return db.query(models.Reminder).filter(
        models.Reminder.owner_id == current_user.id
    ).order_by(models.Reminder.remind_at.asc()).all()


@app.delete("/api/reminders/{reminder_id}", status_code=204)
def delete_reminder(
    reminder_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    r = db.query(models.Reminder).filter(
        models.Reminder.id == reminder_id,
        models.Reminder.owner_id == current_user.id
    ).first()
    if not r:
        raise HTTPException(status_code=404, detail="Reminder not found.")
    db.delete(r)
    db.commit()


# ─── Emergency Packet ──────────────────────────────────────────────────────────

@app.get("/api/emergency-packet")
def generate_emergency_packet(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    docs = db.query(models.Document).filter(
        models.Document.owner_id == current_user.id,
        models.Document.is_emergency == True
    ).all()
    if not docs:
        raise HTTPException(
            status_code=404, detail="No emergency documents found.")
    return {
        "owner_username": current_user.username,
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


FRONTEND_DIST = os.path.join(os.path.dirname(
    __file__), "..", "frontend", "dist")

if os.path.exists(FRONTEND_DIST):
    app.mount(
        "/assets", StaticFiles(directory=os.path.join(FRONTEND_DIST, "assets")), name="assets")

    @app.get("/{full_path:path}")
    def serve_react(full_path: str):
        return FileResponse(os.path.join(FRONTEND_DIST, "index.html"))
