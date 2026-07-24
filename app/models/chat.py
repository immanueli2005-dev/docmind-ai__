# app/models/chat.py - SQLAlchemy database models for chat conversations and message logs

import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class ChatThread(Base):
    __tablename__ = "chat_threads"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    document_ids = Column(Text, default="[\"all\"]")  # JSON string representation of document IDs list
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    user = relationship("User", back_populates="threads")
    messages = relationship("ChatMessage", back_populates="thread", cascade="all, delete-orphan")


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    thread_id = Column(String(36), ForeignKey("chat_threads.id", ondelete="CASCADE"), nullable=False)
    sender = Column(String(20), nullable=False)  # 'user' or 'assistant'
    content = Column(Text, nullable=False)
    citation = Column(Text, nullable=True)        # JSON string containing page, paragraph, confidence, modified date
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    thread = relationship("ChatThread", back_populates="messages")
