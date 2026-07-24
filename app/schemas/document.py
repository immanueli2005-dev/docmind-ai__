# app/schemas/document.py - Pydantic v2 schemas for document listings

from pydantic import BaseModel
from datetime import datetime

class DocumentResponse(BaseModel):
    id: str
    filename: str
    file_type: str
    file_size: str
    pages_count: int
    created_at: datetime

    class Config:
        from_attributes = True

class DocumentRename(BaseModel):
    filename: str
