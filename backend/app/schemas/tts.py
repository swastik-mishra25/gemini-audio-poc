"""
Pydantic schemas for the Text-to-Speech (TTS) module.
Keeps TTS data contracts strictly isolated from STT.
"""

from typing import List, Optional
from pydantic import BaseModel, Field


class VoiceMetadata(BaseModel):
    id: str = Field(..., description="Voice identifier")
    name: str = Field(..., description="Human-readable voice name")
    gender: Optional[str] = Field(None, description="Gender description (e.g. Female, Male, Neutral)")
    description: Optional[str] = Field(None, description="Voice tone/character description")


class TTSRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=5000, description="Input text to synthesize into speech")
    model: str = Field(default="gemini-3.8-flash-tts", description="TTS Model to evaluate")
    voice: Optional[str] = Field(default="Aoede", description="Selected voice identifier")
    language: Optional[str] = Field(default="en-US", description="Language code")
    speech_style: Optional[str] = Field(
        default=None,
        description="Speech style instructions / Director's Chair prompt (e.g. 'whispering excitedly', 'formal news anchor')"
    )


class TTSResponse(BaseModel):
    audio_base64: str = Field(..., description="Generated audio payload in Base64 encoding")
    mime_type: str = Field(default="audio/wav", description="MIME type of the generated audio")
    character_count: int = Field(..., description="Number of characters synthesized")
    latency_ms: float = Field(..., description="End-to-end backend synthesis latency in milliseconds")
    model_used: str = Field(..., description="Model identifier used for speech synthesis")
    voice_used: Optional[str] = Field(None, description="Voice identifier used")


class TTSModelMetadata(BaseModel):
    id: str
    name: str
    description: str
    supported_voices: List[VoiceMetadata]
    supports_style_prompting: bool
