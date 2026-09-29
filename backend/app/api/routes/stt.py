"""
Speech-to-Text (STT) API Endpoints.
Independent route handlers for audio transcription.
"""

import json
import logging
from typing import List, Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status
from app.schemas.stt import (
    STTRequestOptions,
    STTResponse,
    STTModelMetadata,
    TranscriptionMode,
)
from app.services.stt_service import (
    stt_service,
    STTCompatibilityError,
    STTUploadError,
    STTTranscriptionError,
)

logger = logging.getLogger("gemini-audio-poc.routes.stt")
router = APIRouter(prefix="/stt", tags=["Speech-to-Text"])


@router.get("/models", response_model=List[STTModelMetadata])
async def list_stt_models():
    """List all available STT models and supported capabilities."""
    return stt_service.get_available_models()


@router.get("/languages")
async def list_stt_languages():
    """List supported transcription languages."""
    return stt_service.get_supported_languages()


@router.post("/transcribe", response_model=STTResponse)
async def transcribe_audio(
    file: UploadFile = File(None, description="Audio file from recording or upload (e.g. wav, webm, mp3)"),
    model: str = Form(default="gemini-3.5-transcribe"),
    language: Optional[str] = Form(default="auto"),
    mode: TranscriptionMode = Form(default=TranscriptionMode.VERBATIM),
    custom_vocabulary: Optional[str] = Form(default=None, description="Comma-separated or JSON list of vocabulary"),
    enable_diarization: bool = Form(default=False),
    enable_word_timestamps: bool = Form(default=False),
):
    """
    Transcribe audio using the Gemini STT module.
    Differentiates between missing file, empty audio, upload failure, and transcription failure.
    """
    if file is None or not getattr(file, "filename", None):
        logger.warning("STT Request rejected: No file received.")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Audio file was not received by the server. Please record or select an audio file."
        )

    audio_bytes = await file.read()
    if len(audio_bytes) == 0:
        logger.warning(f"STT Request rejected: Empty audio file '{file.filename}' (0 bytes).")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Audio file is empty (0 bytes). Browser recording or file selection produced an empty audio stream."
        )

    logger.info(
        f"STT Request received: filename='{file.filename}', content_type='{file.content_type}', "
        f"bytes={len(audio_bytes)}, model='{model}', mode='{mode}', lang='{language}', "
        f"diarization={enable_diarization}, timestamps={enable_word_timestamps}"
    )

    # Parse custom vocabulary if provided
    vocab_list: List[str] = []
    if custom_vocabulary:
        try:
            parsed = json.loads(custom_vocabulary)
            if isinstance(parsed, list):
                vocab_list = [str(item).strip() for item in parsed if str(item).strip()]
        except Exception:
            vocab_list = [item.strip() for item in custom_vocabulary.split(",") if item.strip()]

    options = STTRequestOptions(
        model=model,
        language=language if language != "auto" else None,
        mode=mode,
        custom_vocabulary=vocab_list,
        enable_diarization=enable_diarization,
        enable_word_timestamps=enable_word_timestamps,
    )

    mime_type = file.content_type or "audio/wav"
    original_filename = file.filename or "audio.wav"

    try:
        return await stt_service.transcribe_audio(
            audio_bytes=audio_bytes,
            mime_type=mime_type,
            options=options,
            original_filename=original_filename,
        )
    except STTCompatibilityError as compat_err:
        logger.warning(f"STT compatibility rejection: {compat_err}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(compat_err)
        )
    except STTUploadError as upload_err:
        logger.error(f"STT upload failure: {upload_err}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(upload_err)
        )
    except STTTranscriptionError as trans_err:
        logger.error(f"STT transcription failure: {trans_err}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(trans_err)
        )
    except ValueError as val_err:
        logger.warning(f"STT validation failure: {val_err}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(val_err)
        )
    except Exception as exc:
        logger.exception(f"STT unexpected error: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Transcription processing error: {str(exc)}"
        )
