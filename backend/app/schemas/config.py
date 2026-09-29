"""
Pydantic schemas for the Configuration module.
Provides system diagnostics and model options without exposing secrets.
"""

from typing import List
from pydantic import BaseModel, Field
from app.schemas.stt import STTModelMetadata
from app.schemas.tts import TTSModelMetadata


class ConfigStatusResponse(BaseModel):
    api_key_configured: bool = Field(..., description="Whether GEMINI_API_KEY is configured on the backend")
    environment: str = Field(..., description="Application environment")
    default_stt_model: str = Field(..., description="Default STT model")
    default_tts_model: str = Field(..., description="Default TTS model")
    available_stt_models: List[STTModelMetadata] = Field(..., description="List of supported STT models & features")
    available_tts_models: List[TTSModelMetadata] = Field(..., description="List of supported TTS models & features")
