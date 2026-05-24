from sqlalchemy import Column, Integer, String, Text, ForeignKey, Boolean, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    # Connects users to their uploaded documents
    documents = relationship("Document", back_populates="owner")


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True, nullable=False)
    file_url = Column(String, nullable=False)
    category = Column(String, index=True, nullable=True)
    ocr_text = Column(Text, nullable=True)
    ai_summary = Column(Text, nullable=True)
    owner_id = Column(Integer, ForeignKey("users.id"))
    # Connects documents back to the User object
    owner = relationship("User", back_populates="documents")
