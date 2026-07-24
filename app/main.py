# app/main.py - Main entry point for FastAPI serving API endpoints and static frontend files

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
import os

from app.core.database import Base, engine
from app.core.config import settings
from app.routers import auth, documents, chat, health

# Auto-create SQLite database tables on server boot
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="DocMind AI API Server",
    description="Intelligent Document Chat & RAG Vector Search Services backend",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS middleware to enable external React / Next.js clients integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production configurations
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routers
app.include_router(auth.router)
app.include_router(documents.router)
app.include_router(chat.router)
app.include_router(health.router)

# Mount static asset folders for SPA hosting from the same server origin
if os.path.exists("css"):
    app.mount("/css", StaticFiles(directory="css"), name="css")
if os.path.exists("js"):
    app.mount("/js", StaticFiles(directory="js"), name="js")
if os.path.exists("assets"):
    app.mount("/assets", StaticFiles(directory="assets"), name="assets")

@app.get("/")
async def serve_frontend():
    """Serve the single page application HTML entry-point."""
    if os.path.exists("index.html"):
        return FileResponse("index.html")
    return {"message": "DocMind AI APIs are online. Front-end index.html not found in root."}
