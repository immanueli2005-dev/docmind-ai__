# app/routers/chat.py - FastAPI router managing chat conversation threads and RAG queries

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timezone
import json
import time
from typing import List, Any

from app.core.database import get_db
from app.models.user import User
from app.models.chat import ChatThread, ChatMessage
from app.models.document import Document
from app.schemas.chat import (
    ChatThreadResponse, ChatThreadCreate, ChatThreadRename, 
    ChatQueryRequest, ChatQueryResponse, CitationDetails, ChunkDetails
)
from app.deps import get_current_user
from app.services.rag_service import semantic_search_chunks
from app.services.llm_service import generate_rag_answer

router = APIRouter(prefix="/api/chat", tags=["AI Chat & Search"])

@router.post("/threads", response_model=ChatThreadResponse, status_code=status.HTTP_201_CREATED)
def create_chat_thread(
    thread_in: ChatThreadCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """Create a new chat conversation thread bound to one, multiple, or all documents."""
    thread_count = db.query(ChatThread).filter(ChatThread.user_id == current_user.id).count()
    title = thread_in.title or f"Chat Session {thread_count + 1}"
    
    # Save document IDs list as JSON list string
    doc_ids_json = json.dumps(thread_in.document_ids)
    
    thread = ChatThread(
        user_id=current_user.id,
        title=title,
        document_ids=doc_ids_json
    )
    db.add(thread)
    db.commit()
    db.refresh(thread)
    
    try:
        doc_ids = json.loads(thread.document_ids)
    except Exception:
        doc_ids = ["all"]
        
    return {
        "id": thread.id,
        "title": thread.title,
        "document_ids": doc_ids,
        "created_at": thread.created_at,
        "messages": []
    }

@router.get("/threads", response_model=List[ChatThreadResponse])
def list_chat_threads(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """List all chat threads belonging to the current user, including message histories."""
    threads = db.query(ChatThread).filter(ChatThread.user_id == current_user.id).all()
    
    result = []
    for thread in threads:
        try:
            doc_ids = json.loads(thread.document_ids)
        except Exception:
            doc_ids = ["all"]
            
        messages = []
        for msg in thread.messages:
            citation_data = None
            if msg.citation:
                try:
                    citation_data = json.loads(msg.citation)
                except Exception:
                    citation_data = None
            messages.append({
                "id": msg.id,
                "sender": msg.sender,
                "content": msg.content,
                "citation": citation_data,
                "timestamp": msg.timestamp
            })
            
        result.append({
            "id": thread.id,
            "title": thread.title,
            "document_ids": doc_ids,
            "created_at": thread.created_at,
            "messages": messages
        })
    return result

@router.put("/threads/{thread_id}", response_model=ChatThreadResponse)
def rename_chat_thread(
    thread_id: str,
    rename: ChatThreadRename,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """Rename a conversation thread title."""
    thread = db.query(ChatThread).filter(
        ChatThread.id == thread_id,
        ChatThread.user_id == current_user.id
    ).first()
    
    if not thread:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat thread not found."
        )
        
    thread.title = rename.title
    db.commit()
    db.refresh(thread)
    
    try:
        doc_ids = json.loads(thread.document_ids)
    except Exception:
        doc_ids = ["all"]
        
    messages = []
    for msg in thread.messages:
        citation_data = None
        if msg.citation:
            try:
                citation_data = json.loads(msg.citation)
            except Exception:
                citation_data = None
        messages.append({
            "id": msg.id,
            "sender": msg.sender,
            "content": msg.content,
            "citation": citation_data,
            "timestamp": msg.timestamp
        })
        
    return {
        "id": thread.id,
        "title": thread.title,
        "document_ids": doc_ids,
        "created_at": thread.created_at,
        "messages": messages
    }

@router.delete("/threads/{thread_id}", status_code=status.HTTP_200_OK)
def delete_chat_thread(
    thread_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """Delete a conversation thread and its associated message logs."""
    thread = db.query(ChatThread).filter(
        ChatThread.id == thread_id,
        ChatThread.user_id == current_user.id
    ).first()
    
    if not thread:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat thread not found."
        )
        
    db.delete(thread)
    db.commit()
    return {"status": "success", "message": f"Successfully deleted thread {thread_id}."}

@router.post("/threads/{thread_id}/query", response_model=ChatQueryResponse)
def query_rag_chat(
    thread_id: str,
    query_in: ChatQueryRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """Submit a question query, execute vector database semantic search, and return RAG-grounded answers."""
    start_time = time.time()
    
    # 1. Verify thread ownership
    thread = db.query(ChatThread).filter(
        ChatThread.id == thread_id,
        ChatThread.user_id == current_user.id
    ).first()
    
    if not thread:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat thread not found."
        )
        
    # Overwrite bounds if document scopes list is defined on requests
    target_docs = query_in.document_ids
    if "all" in target_docs:
        # Check active uploads count
        total_docs = db.query(Document).filter(Document.user_id == current_user.id).all()
        doc_count = len(total_docs)
        doc_names = [d.filename for d in total_docs]
        pages_count = sum(d.pages_count for d in total_docs)
    else:
        # Filter matching specific document rows
        total_docs = db.query(Document).filter(
            Document.id.in_(target_docs),
            Document.user_id == current_user.id
        ).all()
        doc_count = len(total_docs)
        doc_names = [d.filename for d in total_docs]
        pages_count = sum(d.pages_count for d in total_docs)

    # 2. Perform local Cosine semantic vector search lookup in SQLite
    chunks = semantic_search_chunks(
        db=db,
        query=query_in.query,
        document_ids=target_docs,
        k=5,
        min_similarity=query_in.min_similarity
    )
    
    # 3. Formulate prompt context and generate grounded LLM answer
    answer_text, confidence_score = generate_rag_answer(query_in.query, chunks)
    search_duration = round(time.time() - start_time, 2)
    
    # Prepare citation model
    if chunks:
        top_chunk = chunks[0]
        # Resolve modified date from database model
        db_doc = db.query(Document).filter(Document.filename == top_chunk["document"]).first()
        last_mod = db_doc.upload_date.strftime("%Y-%m-%d") if (db_doc and hasattr(db_doc, 'upload_date') and db_doc.upload_date) else datetime.now().strftime("%Y-%m-%d")
        
        citation = CitationDetails(
            document=top_chunk["document"],
            pages=str(top_chunk["page"]),
            paragraph=str(top_chunk["paragraph"]),
            confidence=confidence_score,
            lastModified=last_mod,
            referencedText=top_chunk["content"].replace("<mark>", "").replace("</mark>", "")
        )
    else:
        citation = CitationDetails(
            document="N/A",
            pages="N/A",
            paragraph="N/A",
            confidence="0%",
            lastModified="N/A",
            referencedText=""
        )

    # Convert chunks to schema outputs
    schema_chunks = [
        ChunkDetails(
            id=c["id"],
            document=c["document"],
            page=c["page"],
            paragraph=c["paragraph"],
            similarity=c["similarity"],
            readingTime=c["readingTime"],
            content=c["content"],
            concepts=c.get("concepts", [])
        ) for c in chunks
    ]

    # 4. Save QA dialogue exchange logs in SQL database
    user_msg = ChatMessage(
        thread_id=thread_id,
        sender="user",
        content=query_in.query
    )
    db.add(user_msg)
    
    ai_msg = ChatMessage(
        thread_id=thread_id,
        sender="assistant",
        content=answer_text,
        citation=json.dumps(citation.model_dump())
    )
    db.add(ai_msg)
    db.commit()

    return ChatQueryResponse(
        answer=answer_text,
        citation=citation,
        chunks=schema_chunks,
        searchTime=search_duration,
        docsSearched=doc_count,
        chunksRetrieved=len(schema_chunks),
        pagesAnalyzed=pages_count,
        similarityScore=int(confidence_score.replace("%", "")) if confidence_score else 0,
        speed="Fast" if search_duration < 1.0 else "Normal"
    )
