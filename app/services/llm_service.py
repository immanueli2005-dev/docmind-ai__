# app/services/llm_service.py - AI grounded prompt handlers using Google Gemini

import google.generativeai as genai
from typing import List, Dict, Any, Tuple
from app.core.config import settings

def generate_rag_answer(query: str, chunks: List[Dict[str, Any]], api_key: str = None) -> Tuple[str, str]:
    """
    Formulate system prompt constraints and retrieve Gemini grounded answer response.
    Returns:
        tuple (answer_text, confidence_percentage_string)
    """
    gemini_key = api_key or settings.GEMINI_API_KEY
    
    if not chunks:
        return "I couldn't find this information in the uploaded documents.", "0%"
        
    context_str = ""
    for i, c in enumerate(chunks):
        context_str += f"Chunk {i+1} (Source: {c['document']} | Page: {c['page']} | Paragraph: {c['paragraph']}):\n"
        context_str += f"{c['content']}\n\n"
        
    # Mode 1. Call active Google Gemini API
    if gemini_key:
        try:
            genai.configure(api_key=gemini_key)
            model = genai.GenerativeModel('gemini-1.5-flash')
            
            system_prompt = (
                "You are DocMind AI, a professional document chat assistant.\n"
                "Answer the user's question using ONLY the retrieved document chunks context below.\n"
                "Do NOT use external knowledge.\n"
                "If the context does not contain enough information to answer the question, state exactly: "
                "'I couldn't find this information in the uploaded documents.'\n"
                "Do not assume or invent facts.\n"
                "Format your answer in clean markdown."
            )
            
            prompt = (
                f"{system_prompt}\n\n"
                f"Retrieved Document Chunks Context:\n"
                f"---------------------------------\n"
                f"{context_str}\n"
                f"---------------------------------\n"
                f"User Question: {query}\n\n"
                f"Answer:"
            )
            
            response = model.generate_content(
                contents=prompt,
                generation_config={"temperature": 0.15}
            )
            
            # Estimate confidence based on top vector similarities
            top_similarity = chunks[0]["similarity"]
            confidence = f"{min(99, int(top_similarity))}%"
            
            return response.text.strip(), confidence
            
        except Exception as e:
            print(f"Gemini API completion failed: {e}. Falling back to simulation mode.")

    # Mode 2. Offline / Key-less Simulation Fallback
    top_chunk = chunks[0]
    cleaned_text = top_chunk["content"].replace("<mark>", "").replace("</mark>", "")
    
    simulated_answer = (
        f"According to the uploaded documents (specifically {top_chunk['document']} on page {top_chunk['page']}), "
        f"the text explains: \"{cleaned_text}\"."
    )
    confidence = f"{top_chunk['similarity']}%"
    
    return simulated_answer, confidence

def generate_document_summary(filename: str, file_text: str, api_key: str = None) -> str:
    """Generate a brief paragraph summary of the document contents using Gemini."""
    gemini_key = api_key or settings.GEMINI_API_KEY
    
    if gemini_key:
        try:
            genai.configure(api_key=gemini_key)
            model = genai.GenerativeModel('gemini-1.5-flash')
            
            prompt = (
                f"Summarize the document '{filename}' in 2-3 sentences based on the following text context:\n\n"
                f"{file_text[:8000]}"
            )
            response = model.generate_content(prompt)
            return response.text.strip()
        except Exception as e:
            print(f"Document summary generation failed: {e}")
            
    # Mock summary fallback
    return f"This document outlines the core structural frameworks, operational timelines, and strategic execution milestones for {filename}."
