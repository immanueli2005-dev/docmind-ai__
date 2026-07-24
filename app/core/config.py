# app/core/config.py - Application configuration and validation settings using Pydantic Settings

from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field
import os

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    # Server Configuration
    PORT: int = 8000
    HOST: str = "0.0.0.0"
    DEBUG: bool = True

    # Security & Tokens
    SECRET_KEY: str = "9a7c3b8e2f1d0a5c4b8e9f2d1a0b8c7e9f8d1c0b3a5d8e7f9a8b0c1d2e3f4a5b"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Databases Connection strings
    DATABASE_URL: str = "sqlite:///./docmind.db"

    # External LLM integrations keys
    GEMINI_API_KEY: str = Field(default="")
    OPENAI_API_KEY: str = Field(default="")

    # Workspace directory mappings
    UPLOAD_DIR: str = "data/uploads"
    VECTOR_DB_DIR: str = "data/vectorstore"

settings = Settings()

# Ensure backend upload data storage folders exist
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(settings.VECTOR_DB_DIR, exist_ok=True)
