from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
import models
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
