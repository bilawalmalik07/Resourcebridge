from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy import text

import models
import schemas
import security
from database import engine, get_db

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="ResourceBridge API")


@app.get("/")
def read_root():
    return {"status": "healthy", "project": "ResourceBridge"}


@app.get("/test-db")
def test_database_connection(db: Session = Depends(get_db)):
    try:
        result = db.execute(text("SELECT 1")).fetchone()
        if result[0] == 1:
            return {"database_status": "connected", "message": "Boom! Neon Cloud is connected!"}
    except Exception as e:
        return {"database_status": "error", "details": str(e)}


# User Registration Route
@app.post("/register", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
def register_user(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    # 1. Check if the email already exists in the database
    existing_user = db.query(models.User).filter(
        models.User.email == user_in.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email is already registered."
        )

    # 2. Encrypt the incoming password
    hashed_pass = security.get_password_hash(user_in.password)

    # 3. Create the database object map
    new_user = models.User(
        email=user_in.email,
        hashed_password=hashed_pass
    )

    # 4. Save to Neon Cloud
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


#  User Login
@app.post("/login", response_model=schemas.Token)
def login_user(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Verifies user credentials and returns a secure JWT access token."""
    # 1. Look up the user by email
    user = db.query(models.User).filter(
        models.User.email == form_data.username).first()

    # 2. If user doesn't exist OR password doesn't match, give a 401 Error
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 3. Create the timed token containing their user email
    access_token = security.create_access_token(data={"sub": user.email})

    # 4. Return the token back to the client
    return {"access_token": access_token, "token_type": "bearer"}

# Secure Document Upload Route


@app.post("/documents", response_model=schemas.DocumentResponse, status_code=status.HTTP_201_CREATED)
def upload_document(
    doc_in: schemas.DocumentCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    """Securely creates a new document record linked directly to the logged-in user."""
    new_doc = models.Document(
        title=doc_in.title,
        file_url=doc_in.file_url,
        category=doc_in.category,
        ocr_text=None,        # Placedholders: Filled by OCR engine in Week 7
        ai_summary=None,      # Placedholders: Filled by AI engine in Week 7
        owner_id=current_user.id
    )

    db.add(new_doc)
    db.commit()
    db.refresh(new_doc)
    return new_doc


# Fetch User's Documents Route
@app.get("/documents", response_model=list[schemas.DocumentResponse])
def get_user_documents(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(
        security.get_current_user)  # ◄ Secures this route!
):
    """Retrieves all documents belonging exclusively to the authenticated user."""
    user_docs = db.query(models.Document).filter(
        models.Document.owner_id == current_user.id).all()
    return user_docs
