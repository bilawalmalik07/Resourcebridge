from fastapi import FastAPI, Depends, HTTPException, status
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


# 🚀 NEW: User Registration Route
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
