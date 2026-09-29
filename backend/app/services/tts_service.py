"""
Independent Text-to-Speech (TTS) Service.
Encapsulates all TTS logic using the official google-genai SDK Interactions API.
TTS logic is completely separated from STT logic.
"""

import time
import base64
from typing import List
from google import genai
from app.core.config import settings
from app.schemas.tts import (
    TTSRequest,
    TTSResponse,
    TTSModelMetadata,
    VoiceMetadata,
)


class TTSService:
    """Service interface and handler for Text-to-Speech synthesis via Gemini API."""

    def _get_client(self) -> genai.Client:
        """Instantiate official GenAI client using backend-configured key."""
        api_key = settings.get_api_key()
        if not api_key:
            raise ValueError(
                "GEMINI_API_KEY is not configured. Please set your GEMINI_API_KEY in backend/.env"
            )
        return genai.Client(api_key=api_key)

    def get_available_models(self) -> List[TTSModelMetadata]:
        """Returns metadata for supported TTS models."""
        voices = self.get_available_voices()
        return [
            TTSModelMetadata(
                id="gemini-3.8-flash-tts",
                name="Gemini 3.8 Flash TTS",
                description="High fidelity, expressive speech synthesis with Director's Chair style prompting",
                supported_voices=voices,
                supports_style_prompting=True,
            ),
            TTSModelMetadata(
                id="gemini-3.8-flash-lite-tts",
                name="Gemini 3.8 Flash-Lite TTS",
                description="Ultra low-latency lightweight speech synthesis model for fast turnaround",
                supported_voices=voices,
                supports_style_prompting=True,
            ),
        ]

    def get_available_voices(self) -> List[VoiceMetadata]:
        """Returns standard voices available for Gemini TTS."""
        return [
            VoiceMetadata(id="Aoede", name="Aoede", gender="Female", description="Warm, breezy, and engaging"),
            VoiceMetadata(id="Charon", name="Charon", gender="Male", description="Deep, authoritative, and informative"),
            VoiceMetadata(id="Fenrir", name="Fenrir", gender="Male", description="Energetic, excitable, and direct"),
            VoiceMetadata(id="Kore", name="Kore", gender="Female", description="Firm, clear, and expressive"),
            VoiceMetadata(id="Puck", name="Puck", gender="Neutral", description="Friendly, upbeat, and animated"),
            VoiceMetadata(id="Zephyr", name="Zephyr", gender="Neutral", description="Bright, dynamic, and clear"),
            VoiceMetadata(id="Leda", name="Leda", gender="Female", description="Youthful, soft, and approachable"),
            VoiceMetadata(id="Orus", name="Orus", gender="Male", description="Firm, confident, and steady"),
        ]

    async def synthesize_speech(self, request: TTSRequest) -> TTSResponse:
        """
        Synthesize text into speech audio using Gemini TTS API.

        Args:
            request: TTSRequest containing input text, voice, model, language, and style.

        Returns:
            TTSResponse containing base64 audio payload and latency metrics.
        """
        client = self._get_client()
        start_time = time.perf_counter()

        # Format prompt with Director's Chair style instruction if provided
        final_prompt = request.text.strip()
        if request.speech_style and request.speech_style.strip():
            final_prompt = f"Say with {request.speech_style.strip()}:\n\"{request.text.strip()}\""

        # Build speech config with voice and language
        speech_item = {}
        if request.voice and request.voice.strip():
            speech_item["voice"] = request.voice.strip()
        if request.language and request.language.strip():
            speech_item["language"] = request.language.strip()

        generation_config = {}
        if speech_item:
            generation_config["speech_config"] = [speech_item]

        # Call Gemini TTS via Interactions API
        interaction = client.interactions.create(
            model=request.model,
            input=final_prompt,
            response_format={"type": "audio"},
            generation_config=generation_config if generation_config else None,
        )

        elapsed_ms = (time.perf_counter() - start_time) * 1000

        # Extract output audio from interaction
        audio_b64 = None
        mime_type = "audio/wav"

        # Check helper convenience property
        if hasattr(interaction, "output_audio") and interaction.output_audio:
            out_audio = interaction.output_audio
            raw_data = getattr(out_audio, "data", None)
            if isinstance(raw_data, bytes):
                audio_b64 = base64.b64encode(raw_data).decode("utf-8")
            elif isinstance(raw_data, str):
                audio_b64 = raw_data
            mime_type = getattr(out_audio, "mime_type", None) or "audio/wav"

        # Fallback inspection of steps
        if not audio_b64:
            for step in getattr(interaction, "steps", []) or []:
                content_list = getattr(step, "content", None) or (step.get("content") if isinstance(step, dict) else [])
                for content in content_list or []:
                    c_type = getattr(content, "type", None) or (content.get("type") if isinstance(content, dict) else None)
                    if c_type == "audio":
                        data = getattr(content, "data", None) or (content.get("data") if isinstance(content, dict) else None)
                        if isinstance(data, bytes):
                            audio_b64 = base64.b64encode(data).decode("utf-8")
                        elif isinstance(data, str):
                            audio_b64 = data
                        mime_type = getattr(content, "mime_type", None) or (content.get("mime_type") if isinstance(content, dict) else "audio/wav")
                        break
                if audio_b64:
                    break

        if not audio_b64:
            # Handle possible text response if model refused or failed
            err_text = getattr(interaction, "output_text", None) or "No audio data was returned by the model."
            raise ValueError(f"TTS audio synthesis failed: {err_text}")

        return TTSResponse(
            audio_base64=audio_b64,
            mime_type=mime_type,
            character_count=len(request.text),
            latency_ms=round(elapsed_ms, 2),
            model_used=request.model,
            voice_used=request.voice,
        )


tts_service = TTSService()
