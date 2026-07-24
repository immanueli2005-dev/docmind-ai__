# app/routers/health.py - FastAPI health status check router

from fastapi import APIRouter
from datetime import datetime, timezone

router = APIRouter(prefix="/api/health", tags=["System Utility"])

@router.get("")
def health_check():
    """Return API services status logs and server time metrics."""
    return {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "service": "DocMind AI Core API Server"
    }
