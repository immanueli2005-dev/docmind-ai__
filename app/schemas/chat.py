# app/schemas/chat.py - Pydantic v2 schemas for AI Chat and RAG Search operations

from pydantic import BaseModel, Field
from datetime import datetime
from typing import List, Optional

class CitationDetails(BaseModel):
    document: str
    pages: str
    paragraph: Optional[str] = "N/A"
    confidence: str
    lastModified: str
    referencedText: str

class ChunkDetails(BaseModel):
    id: str
    document: str
    page: int
    paragraph: int
    similarity: int
    readingTime: str
    content: str
    concepts: List[str] = []

class ChatMessageResponse(BaseModel):
    id: str
    sender: str
    content: str
    citation: Optional[CitationDetails] = None
    timestamp: datetime

    class Config:
        from_attributes = True

class ChatThreadResponse(BaseModel):
    id: str
    title: str
    document_ids: List[str] = []
    created_at: datetime
    messages: List[ChatMessageResponse] = []

    class Config:
        from_attributes = True

class ChatThreadCreate(BaseModel):
    document_ids: List[str] = ["all"]
    title: Optional[str] = None

class ChatThreadRename(BaseModel):
    title: str

class ChatQueryRequest(BaseModel):
    query: str
    document_ids: List[str] = ["all"]
    min_similarity: int = 80

class ChatQueryResponse(BaseModel):
    answer: str
    citation: CitationDetails
    chunks: List[ChunkDetails]
    searchTime: float
    docsSearched: int
    chunksRetrieved: int
    pagesAnalyzed: int
    similarityScore: int
    speed: str = "Fast"
