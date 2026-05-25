from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional, List, Any


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
    is_emergency: bool = False


class DocumentResponse(BaseModel):
    id: int
    title: str
    file_url: str
    category: str | None = None
    ocr_text: str | None = None
    ai_summary: str | None = None
    ai_summary_es: str | None = None
    action_items: Any | None = None
    is_emergency: bool = False
    owner_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class UploadResponse(BaseModel):
    file_url: str
    original_filename: str
