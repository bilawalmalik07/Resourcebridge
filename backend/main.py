import os
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
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

# FIX: Original code hardcoded only localhost:5173, which breaks in production.
# Now reads ALLOWED_ORIGINS from the environment variable so both local dev
# and the deployed Render frontend URL work without code changes.
raw_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173")
allowed_origins = [origin.strip() for origin in raw_origins.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    return {"status": "healthy", "project": "ResourceBridge"}


@app.get("/test-db")
def test_database_connection(db: Session = Depends(get_db)):
    try:
        result = db.execute(text("SELECT 1")).fetchone()
        if result[0] == 1:
            return {"database_status": "connected", "message": "Neon Cloud is connected!"}
    except Exception as e:
        return {"database_status": "error", "details": str(e)}


@app.post("/register", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
def register_user(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(models.User).filter(
        models.User.email == user_in.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email is already registered."
        )

    hashed_pass = security.get_password_hash(user_in.password)
    new_user = models.User(
        email=user_in.email,
        hashed_password=hashed_pass
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@app.post("/login", response_model=schemas.Token)
def login_user(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Verifies user credentials and returns a secure JWT access token."""
    user = db.query(models.User).filter(
        models.User.email == form_data.username).first()

    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = security.create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}


@app.post("/documents", response_model=schemas.DocumentResponse, status_code=status.HTTP_201_CREATED)
def upload_document(
    doc_in: schemas.DocumentCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    """Securely uploads a document and triggers the Gemini AI pipeline."""
    print(f"Triggering ResourceBridge AI engine for: {doc_in.title}...")
    ai_results = ai_service.process_document_with_ai(doc_in.file_url)

    new_doc = models.Document(
        title=doc_in.title,
        file_url=doc_in.file_url,
        category=doc_in.category or "Uncategorized",
        ocr_text=ai_results["ocr_text"],
        ai_summary=ai_results["ai_summary"],
        owner_id=current_user.id
    )

    db.add(new_doc)
    db.commit()
    db.refresh(new_doc)
    return new_doc


@app.get("/documents", response_model=list[schemas.DocumentResponse])
def get_user_documents(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    """Retrieves all documents belonging exclusively to the authenticated user."""
    user_docs = db.query(models.Document).filter(
        models.Document.owner_id == current_user.id).all()
    return user_docs
