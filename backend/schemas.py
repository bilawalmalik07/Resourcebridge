from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional


class UserCreate(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    email: EmailStr
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    email: str | None = None


class DocumentCreate(BaseModel):
    title: str
    file_url: str
    category: str | None = None


class DocumentResponse(BaseModel):
    id: int
    title: str
    file_url: str
    category: str | None = None
    ocr_text: str | None = None
    ai_summary: str | None = None
    owner_id: int
    # FIX: Added created_at to response schema to match the new model field
    # Without this, the field would never be returned to the frontend
    created_at: datetime

    class Config:
        from_attributes = True
