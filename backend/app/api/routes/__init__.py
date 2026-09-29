"""API route modules."""
from app.api.routes.stt import router as stt_router
from app.api.routes.tts import router as tts_router
from app.api.routes.config import router as config_router

__all__ = ["stt_router", "tts_router", "config_router"]
