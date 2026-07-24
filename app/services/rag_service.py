# app/services/rag_service.py - Semantic embedding generation and FAISS vector indices helper

import os
import json
import math
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.models.document import DocumentChunk
from app.core.config import settings

# Attempt native vector imports
try:
    import faiss
    from sentence_transformers import SentenceTransformer
    HAS_NATIVE_VECTOR = True
except ImportError:
    HAS_NATIVE_VECTOR = False

_model = None

def get_sentence_transformer_model():
    """Load and cache SentenceTransformer models locally."""
    global _model
    if not HAS_NATIVE_VECTOR:
        return None
    if _model is None:
        try:
            _model = SentenceTransformer("all-MiniLM-L6-v2")
        except Exception as e:
            print(f"Error loading native SentenceTransformer: {e}")
            return None
    return _model

def generate_embedding(text: str, api_key: str = None) -> List[float]:
    """
    Generate dense embedding vector for text segment.
    Tries 3 modes in order:
    1. Native local SentenceTransformer (all-MiniLM-L6-v2, 384 dims).
    2. Gemini Embeddings API (models/embedding-001, 768 dims) if key is set.
    3. Pure-python token frequency character index (384 dims) as a fail-safe fallback.
    """
    # Mode 1. Native SentenceTransformer
    if HAS_NATIVE_VECTOR:
        model = get_sentence_transformer_model()
        if model:
            try:
                vector = model.encode(text)
                return vector.tolist()
            except Exception as e:
                print(f"Native SentenceTransformer failed: {e}")

    # Mode 2. Gemini Embeddings API
    gemini_key = api_key or settings.GEMINI_API_KEY
    if gemini_key:
        try:
            import google.generativeai as genai
            genai.configure(api_key=gemini_key)
            response = genai.embed_content(
                model="models/embedding-001",
                content=text,
                task_type="retrieval_document"
            )
            return response['embedding']
        except Exception as e:
            print(f"Gemini API embeddings retrieval failed: {e}")

    # Mode 3. Pure-python word projection index fallback (384 dimensions)
    vector = [0.0] * 384
    words = text.lower().split()
    for word in words:
        idx = hash(word) % 384
        vector[idx] += 1.0
        
    # L2 Normalization
    magnitude = math.sqrt(sum(x * x for x in vector))
    if magnitude > 0:
        vector = [x / magnitude for x in vector]
        
    return vector

def add_document_chunks_to_index(db: Session, document_id: str, chunks: List[Dict[str, Any]], api_key: str = None):
    """Generate vectors for each chunk and insert into SQLite document_chunks table."""
    for chunk in chunks:
        vector = generate_embedding(chunk["content"], api_key)
        db_chunk = DocumentChunk(
            document_id=document_id,
            page_number=chunk["page"],
            paragraph_number=chunk["paragraph"],
            content=chunk["content"],
            embedding_json=json.dumps(vector)
        )
        db.add(db_chunk)
    db.commit()

def semantic_search_chunks(
    db: Session, 
    query: str, 
    document_ids: List[str], 
    k: int = 5, 
    min_similarity: int = 80, 
    api_key: str = None
) -> List[Dict[str, Any]]:
    """Query context chunks matching search constraints via Cosine similarity."""
    query_vector = generate_embedding(query, api_key)
    
    query_db = db.query(DocumentChunk)
    if "all" not in document_ids and len(document_ids) > 0:
        query_db = query_db.filter(DocumentChunk.document_id.in_(document_ids))
        
    db_chunks = query_db.all()
    matched_chunks = []
    
    for chunk in db_chunks:
        if not chunk.embedding_json:
            continue
        try:
            chunk_vector = json.loads(chunk.embedding_json)
        except Exception:
            continue
            
        # Match dimensions length safety check
        if len(query_vector) != len(chunk_vector):
            # Recalculate query vector with matching dimension
            query_vector = generate_embedding(query, api_key)
            if len(query_vector) != len(chunk_vector):
                continue
            
        # Cosine similarity calculations
        dot_product = sum(x * y for x, y in zip(query_vector, chunk_vector))
        mag_q = math.sqrt(sum(x * x for x in query_vector))
        mag_c = math.sqrt(sum(x * x for x in chunk_vector))
        
        similarity = 0.0
        if mag_q * mag_c > 0:
            similarity = dot_product / (mag_q * mag_c)
            
        similarity_pct = int(similarity * 100)
        
        if similarity_pct >= min_similarity:
            doc_name = chunk.document.filename if chunk.document else "Unknown"
            
            # Simple keyword noun-extraction for concepts list matching
            concepts = list(set([
                w.strip(".,()\"").capitalize() 
                for w in chunk.content.split() 
                if len(w) > 4 and w[0].isupper()
            ]))[:3]
            
            matched_chunks.append({
                "id": f"chunk-{chunk.id}",
                "document": doc_name,
                "page": chunk.page_number,
                "paragraph": chunk.paragraph_number,
                "similarity": similarity_pct,
                "readingTime": f"{max(1, len(chunk.content.split()) // 150)} min",
                "content": chunk.content,
                "concepts": concepts
            })
            
    # Sort outputs by cosine similarity match descending
    matched_chunks.sort(key=lambda x: x["similarity"], reverse=True)
    return matched_chunks[:k]
