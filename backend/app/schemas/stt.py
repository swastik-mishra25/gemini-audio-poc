"""
Pydantic schemas for the Speech-to-Text (STT) module.
Keeps STT data contracts strictly isolated from TTS.
"""

from typing import List, Optional
from enum import Enum
from pydantic import BaseModel, Field


class TranscriptionMode(str, Enum):
    VERBATIM = "verbatim"
    SMART = "smart"


class WordTimestamp(BaseModel):
    word: str = Field(..., description="Recognized word text")
    start_offset: Optional[str] = Field(None, description="Start offset (e.g. '0.100s')")
    end_offset: Optional[str] = Field(None, description="End offset (e.g. '0.450s')")
    speaker: Optional[str] = Field(None, description="Speaker identifier if diarization was active")


class DiarizedSegment(BaseModel):
    speaker: str = Field(..., description="Identified speaker label (e.g., spk_1 or Speaker 1)")
    start_offset: Optional[str] = Field(None, description="Start offset string")
    end_offset: Optional[str] = Field(None, description="End offset string")
    text: str = Field(..., description="Transcript text for this speaker turn")


class STTRequestOptions(BaseModel):
    model: str = Field(default="gemini-3.5-transcribe", description="STT Model to evaluate")
    language: Optional[str] = Field(None, description="Language code (e.g., 'en-US', 'es-ES', 'auto')")
    mode: TranscriptionMode = Field(default=TranscriptionMode.VERBATIM, description="Transcription mode")
    custom_vocabulary: Optional[List[str]] = Field(default_factory=list, description="Custom vocabulary/keywords list")
    enable_diarization: bool = Field(default=False, description="Enable speaker diarization")
    enable_word_timestamps: bool = Field(default=False, description="Enable word-level timestamps")


class STTResponse(BaseModel):
    transcript: str = Field(..., description="Full synthesized transcription text")
    detected_language: Optional[str] = Field(None, description="Detected or specified language")
    diarized_segments: Optional[List[DiarizedSegment]] = Field(default_factory=list, description="Diarized speaker turns")
    word_timestamps: Optional[List[WordTimestamp]] = Field(default_factory=list, description="Word-level timestamps")
    latency_ms: float = Field(..., description="End-to-end backend processing latency in milliseconds")
    model_used: str = Field(..., description="Model identifier used for transcription")
    audio_duration_seconds: Optional[float] = Field(None, description="Input audio duration if measured")


class STTModelMetadata(BaseModel):
    id: str
    name: str
    description: str
    supported_modes: List[str]
    supports_diarization: bool
    supports_custom_vocabulary: bool
    supports_word_timestamps: bool
