# app/routers/documents.py - FastAPI router managing document uploads, indexing, lists, and deletions

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status, Form
from sqlalchemy.orm import Session
from typing import List, Any
import os
import shutil

from app.core.database import get_db
from app.core.config import settings
from app.models.user import User
from app.models.document import Document, DocumentChunk
from app.schemas.document import DocumentResponse, DocumentRename
from app.deps import get_current_user
from app.services.document_service import extract_document_pages, chunk_document_pages
from app.services.rag_service import add_document_chunks_to_index

router = APIRouter(prefix="/api/documents", tags=["Documents"])

@router.post("/upload", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """Upload PDF, DOCX, or TXT file, parse pages text, and insert vector index chunks."""
    filename = file.filename
    extension = filename.split(".")[-1].lower()
    
    if extension not in ["pdf", "docx", "txt"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported file format. Only PDF, DOCX, and TXT files are accepted."
        )
        
    # Build unique file store paths
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    temp_filepath = os.path.join(settings.UPLOAD_DIR, f"{current_user.id}_{filename}")
    
    try:
        # Save uploaded file
        with open(temp_filepath, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Compute size string
        size_bytes = os.path.getsize(temp_filepath)
        size_mb = f"{(size_bytes / (1024 * 1024)):.2f} MB"
        
        # 1. Parse text pages content
        pages = extract_document_pages(temp_filepath, extension)
        pages_count = len(pages)
        
        # 2. Chunk text pages content
        chunks = chunk_document_pages(pages)
        
        # 3. Create Document DB record
        doc = Document(
            user_id=current_user.id,
            filename=filename,
            file_type=extension,
            file_size=size_mb,
            pages_count=pages_count
        )
        db.add(doc)
        db.commit()
        db.refresh(doc)
        
        # 4. Generate embeddings and save chunks
        add_document_chunks_to_index(db, doc.id, chunks)
        
        return doc
        
    except Exception as e:
        # Clean up corrupted temp files
        if os.path.exists(temp_filepath):
            os.remove(temp_filepath)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process and index document. Reason: {e}"
        )

@router.get("", response_model=List[DocumentResponse])
def list_documents(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """List all documents uploaded by the authenticated user."""
    return db.query(Document).filter(Document.user_id == current_user.id).all()

@router.put("/{doc_id}", response_model=DocumentResponse)
def rename_document(
    doc_id: str,
    rename: DocumentRename,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """Rename document library file catalog records."""
    doc = db.query(Document).filter(
        Document.id == doc_id,
        Document.user_id == current_user.id
    ).first()
    
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found."
        )
        
    doc.filename = rename.filename
    db.commit()
    db.refresh(doc)
    return doc

@router.delete("/{doc_id}", status_code=status.HTTP_200_OK)
def delete_document(
    doc_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """Permanently delete a document file, clearing database metadata and cascading vector indices."""
    doc = db.query(Document).filter(
        Document.id == doc_id,
        Document.user_id == current_user.id
    ).first()
    
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found."
        )
        
    # Delete physical uploads file
    filepath = os.path.join(settings.UPLOAD_DIR, f"{current_user.id}_{doc.filename}")
    if os.path.exists(filepath):
        try:
            os.remove(filepath)
        except Exception as e:
            print(f"Error removing physical upload file: {e}")
            
    db.delete(doc)
    db.commit()
    
    return {"status": "success", "message": f"Successfully deleted document {doc_id}."}

@router.get("/{doc_id}/preview")
def preview_document_pages(
    doc_id: str,
    page: int = 1,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """Return raw text pages of document reference matching index for modal previews."""
    doc = db.query(Document).filter(
        Document.id == doc_id,
        Document.user_id == current_user.id
    ).first()
    
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found."
        )
        
    chunks = db.query(DocumentChunk).filter(
        DocumentChunk.document_id == doc_id,
        DocumentChunk.page_number == page
    ).all()
    
    raw_content = "\n\n".join(chunk.content for chunk in chunks)
    return {
        "document": doc.filename,
        "page": page,
        "content": raw_content or "No content available on this page."
    }
