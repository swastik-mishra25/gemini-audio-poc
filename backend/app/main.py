"""
Main FastAPI Application Entry Point for Gemini Audio POC.
Explicitly isolates STT and TTS modules.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.routes import stt_router, tts_router, config_router

app = FastAPI(
    title="Gemini Audio POC API",
    description="Independent evaluation of Speech-to-Text (STT) and Text-to-Speech (TTS) using Gemini models",
    version="1.0.0",
)

# Configure CORS for local React/Vite development
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount completely separated module routers
app.include_router(stt_router, prefix="/api")
app.include_router(tts_router, prefix="/api")
app.include_router(config_router, prefix="/api")


@app.get("/")
async def root():
    """Root entry point providing service health and links."""
    return {
        "status": "online",
        "service": "Gemini Audio POC API",
        "stt_module": "online (/api/stt)",
        "tts_module": "online (/api/tts)",
        "docs": "http://127.0.0.1:8000/docs",
        "health": "http://127.0.0.1:8000/api/health",
        "config_status": "http://127.0.0.1:8000/api/config/status",
    }


@app.get("/api/health")
async def health_check():
    """Basic health check endpoint."""
    return {
        "status": "healthy",
        "service": "gemini-audio-poc-backend",
        "stt_module": "ready",
        "tts_module": "ready",
    }
