import os
import tempfile
from pathlib import Path
from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import text
from dotenv import load_dotenv
import ai_service
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

# ─── Auth & Database ──────────────────────────────────────────────────────────


@app.get("/api/health")
def read_root():
    return {"status": "healthy", "project": "ResourceBridge"}


@app.post("/api/register", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
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


@app.post("/api/login", response_model=schemas.Token)
def login_user(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(
        models.User.email == form_data.username).first()
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")
    token = security.create_access_token(data={"sub": user.email})
    return {"access_token": token, "token_type": "bearer"}

# ─── Unified Upload & Process ──────────────────────────────────────────────────


@app.post("/api/upload")
async def upload_document(
    file: UploadFile = File(...),
    current_user: models.User = Depends(security.get_current_user),
    db: Session = Depends(get_db)
):
    # 1. Save file to temp location
    suffix = Path(file.filename).suffix
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(await file.read())
        temp_path = tmp.name

    try:
        # 2. Call the AI service (passing local temp path)
        # Assuming you update ai_service to accept a local file path
        ai_data = ai_service.process_document_with_ai(temp_path)

        # 3. Create database record
        doc = models.Document(
            title=file.filename,
            file_url="local_upload",
            category="Uncategorized",
            ocr_text=ai_data["ocr_text"],
            ai_summary=ai_data["ai_summary"],
            ai_summary_es=ai_data["ai_summary_es"],
            action_items=ai_data["action_items"],
            owner_id=current_user.id,
        )
        db.add(doc)
        db.commit()
        db.refresh(doc)
        return doc
    finally:
        # 4. Clean up
        if os.path.exists(temp_path):
            os.remove(temp_path)

# ─── Documents ─────────────────────────────────────────────────────────────────


@app.get("/api/documents", response_model=list[schemas.DocumentResponse])
def get_documents(db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    return db.query(models.Document).filter(models.Document.owner_id == current_user.id).order_by(models.Document.created_at.desc()).all()


@app.delete("/api/documents/{doc_id}", status_code=204)
def delete_document(doc_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    doc = db.query(models.Document).filter(models.Document.id ==
                                           doc_id, models.Document.owner_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")
    db.delete(doc)
    db.commit()

# ─── Frontend Serving ──────────────────────────────────────────────────────────


FRONTEND_DIST = os.path.join(os.path.dirname(
    __file__), "..", "frontend", "dist")
if os.path.exists(FRONTEND_DIST):
    app.mount(
        "/assets", StaticFiles(directory=os.path.join(FRONTEND_DIST, "assets")), name="assets")

    @app.get("/{full_path:path}")
    def serve_react(full_path: str):
        return FileResponse(os.path.join(FRONTEND_DIST, "index.html"))
