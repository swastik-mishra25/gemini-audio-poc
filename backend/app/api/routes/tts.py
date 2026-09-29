"""
Text-to-Speech (TTS) API Endpoints.
Independent route handlers for speech synthesis.
"""

from typing import List
from fastapi import APIRouter, HTTPException, status
from app.schemas.tts import (
    TTSRequest,
    TTSResponse,
    TTSModelMetadata,
    VoiceMetadata,
)
from app.services.tts_service import tts_service

router = APIRouter(prefix="/tts", tags=["Text-to-Speech"])


@router.get("/models", response_model=List[TTSModelMetadata])
async def list_tts_models():
    """List all available TTS models and supported features."""
    return tts_service.get_available_models()


@router.get("/voices", response_model=List[VoiceMetadata])
async def list_tts_voices():
    """List available voices for speech synthesis."""
    return tts_service.get_available_voices()


@router.post("/synthesize", response_model=TTSResponse)
async def synthesize_speech(payload: TTSRequest):
    """
    Synthesize text into speech audio using the Gemini TTS module.
    Returns base64 audio and synthesis latency measurement.
    """
    if not payload.text or not payload.text.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Text payload cannot be empty."
        )

    try:
        return await tts_service.synthesize_speech(payload)
    except ValueError as val_err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(val_err)
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Speech synthesis error: {str(exc)}"
        )
