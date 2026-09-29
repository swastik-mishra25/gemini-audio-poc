"""
Configuration and Diagnostic API Endpoints.
Reports environment and model capabilities without exposing secret keys.
"""

from fastapi import APIRouter
from app.core.config import settings
from app.schemas.config import ConfigStatusResponse
from app.services.stt_service import stt_service
from app.services.tts_service import tts_service

router = APIRouter(prefix="/config", tags=["Configuration"])


@router.get("/status", response_model=ConfigStatusResponse)
async def get_config_status():
    """
    Check backend configuration status.
    Keeps API keys only on the backend (returns boolean flag, never raw key).
    """
    return ConfigStatusResponse(
        api_key_configured=bool(settings.get_api_key() and len(settings.get_api_key().strip()) > 0),
        environment=settings.ENVIRONMENT,
        default_stt_model=settings.DEFAULT_STT_MODEL,
        default_tts_model=settings.DEFAULT_TTS_MODEL,
        available_stt_models=stt_service.get_available_models(),
        available_tts_models=tts_service.get_available_models(),
    )
