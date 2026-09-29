"""
Independent Speech-to-Text (STT) Service.
Encapsulates all STT logic using the official google-genai SDK Interactions API.
STT logic is completely separated from TTS logic.
"""

import time
import os
import tempfile
import logging
import mimetypes
from typing import List, Optional, Tuple
from google import genai
from app.core.config import settings
from app.schemas.stt import (
    STTRequestOptions,
    STTResponse,
    STTModelMetadata,
    DiarizedSegment,
    WordTimestamp,
    TranscriptionMode,
)

logger = logging.getLogger("gemini-audio-poc.stt")
logging.basicConfig(level=logging.INFO)


class STTCompatibilityError(ValueError):
    """Raised when incompatible STT configuration options are specified."""
    pass


class STTUploadError(RuntimeError):
    """Raised when Gemini Files API upload fails."""
    pass


class STTTranscriptionError(RuntimeError):
    """Raised when Gemini transcription request fails."""
    pass


def detect_audio_format(data: bytes, filename: str = "", content_type: str = "") -> Tuple[str, str]:
    """
    Determines the exact audio MIME type and file extension.
    Prioritizes file header magic bytes to prevent misidentifying browser-recorded WebM or WAV files.
    """
    # Magic bytes detection
    if len(data) >= 4:
        if data[:4] == b"RIFF" and len(data) >= 12 and data[8:12] == b"WAVE":
            return ("audio/wav", ".wav")
        if data[:4] == b"\x1aE\xdf\xa3":
            return ("audio/webm", ".webm")
        if data[:3] == b"ID3" or (data[0] == 0xFF and (data[1] & 0xE0) == 0xE0):
            return ("audio/mp3", ".mp3")
        if data[:4] == b"OggS":
            return ("audio/ogg", ".ogg")
        if data[:4] == b"fLaC":
            return ("audio/flac", ".flac")
        if len(data) >= 8 and data[4:8] == b"ftyp":
            return ("audio/mp4", ".m4a")

    # Content-type detection
    ct = (content_type or "").split(";")[0].strip().lower()
    if "webm" in ct:
        return ("audio/webm", ".webm")
    if "wav" in ct:
        return ("audio/wav", ".wav")
    if "mp3" in ct or "mpeg" in ct:
        return ("audio/mp3", ".mp3")
    if "ogg" in ct:
        return ("audio/ogg", ".ogg")
    if "mp4" in ct or "m4a" in ct:
        return ("audio/m4a", ".m4a")
    if "flac" in ct:
        return ("audio/flac", ".flac")
    if "aac" in ct:
        return ("audio/aac", ".aac")

    # Extension detection
    ext = os.path.splitext(filename)[1].lower()
    ext_map = {
        ".wav": ("audio/wav", ".wav"),
        ".webm": ("audio/webm", ".webm"),
        ".mp3": ("audio/mp3", ".mp3"),
        ".ogg": ("audio/ogg", ".ogg"),
        ".m4a": ("audio/m4a", ".m4a"),
        ".flac": ("audio/flac", ".flac"),
        ".aac": ("audio/aac", ".aac"),
        ".aiff": ("audio/aiff", ".aiff"),
        ".aif": ("audio/aiff", ".aiff"),
        ".opus": ("audio/opus", ".opus"),
    }
    if ext in ext_map:
        return ext_map[ext]

    guessed, _ = mimetypes.guess_type(filename)
    if guessed and guessed.startswith("audio/"):
        return (guessed, ext or ".wav")

    return ("audio/wav", ".wav")


class STTService:
    """Service interface and handler for Speech-to-Text transcription via Gemini API."""

    def _get_client(self) -> genai.Client:
        """Instantiate official GenAI client using backend-configured key."""
        api_key = settings.get_api_key()
        if not api_key:
            raise ValueError(
                "GEMINI_API_KEY is not configured. Please set your GEMINI_API_KEY in backend/.env"
            )
        return genai.Client(api_key=api_key)

    def get_available_models(self) -> List[STTModelMetadata]:
        """Returns metadata for supported STT models."""
        return [
            STTModelMetadata(
                id="gemini-3.5-transcribe",
                name="Gemini 3.5 Transcribe",
                description="Fast and accurate speech-to-text model with smart & verbatim modes, diarization, and timestamps",
                supported_modes=[TranscriptionMode.VERBATIM.value, TranscriptionMode.SMART.value],
                supports_diarization=True,
                supports_custom_vocabulary=True,
                supports_word_timestamps=True,
            )
        ]

    def get_supported_languages(self) -> List[dict]:
        """Returns supported language codes for STT."""
        return [
            {"code": "auto", "name": "Auto Detect"},
            {"code": "en-US", "name": "English (US)"},
            {"code": "en-GB", "name": "English (UK)"},
            {"code": "es-ES", "name": "Spanish"},
            {"code": "fr-FR", "name": "French"},
            {"code": "de-DE", "name": "German"},
            {"code": "ja-JP", "name": "Japanese"},
            {"code": "hi-IN", "name": "Hindi"},
            {"code": "zh-CN", "name": "Mandarin Chinese"},
            {"code": "pt-BR", "name": "Portuguese (Brazil)"},
            {"code": "it-IT", "name": "Italian"},
            {"code": "ko-KR", "name": "Korean"},
        ]

    def validate_options(self, options: STTRequestOptions) -> None:
        """
        Enforce strict Gemini API compatibility rules.
        Rejects incompatible configurations before making API calls:
        - Smart mode cannot be combined with speaker diarization.
        - Smart mode cannot be combined with word-level timestamps.
        - Custom vocabulary cannot be combined with speaker diarization.
        - Custom vocabulary cannot be combined with word-level timestamps.
        """
        has_custom_vocab = bool(options.custom_vocabulary and len(options.custom_vocabulary) > 0)
        is_smart = (options.mode == TranscriptionMode.SMART)

        if is_smart and options.enable_diarization:
            raise STTCompatibilityError(
                "Incompatible configuration: Smart transcription ('smart') cannot be combined with speaker diarization. "
                "Please switch to 'verbatim' mode to use speaker diarization."
            )

        if is_smart and options.enable_word_timestamps:
            raise STTCompatibilityError(
                "Incompatible configuration: Smart transcription ('smart') cannot be combined with word-level timestamps. "
                "Please switch to 'verbatim' mode to use word-level timestamps."
            )

        if has_custom_vocab and options.enable_diarization:
            raise STTCompatibilityError(
                "Incompatible configuration: Custom vocabulary cannot be combined with speaker diarization. "
                "Please disable speaker diarization or remove custom vocabulary terms."
            )

        if has_custom_vocab and options.enable_word_timestamps:
            raise STTCompatibilityError(
                "Incompatible configuration: Custom vocabulary cannot be combined with word-level timestamps. "
                "Please disable word timestamps or remove custom vocabulary terms."
            )

    async def transcribe_audio(
        self,
        audio_bytes: bytes,
        mime_type: str,
        options: STTRequestOptions,
        original_filename: str = "audio.wav",
    ) -> STTResponse:
        """
        Transcribes audio using Gemini Files API and the Interactions API.
        """
        # Step 1: Validate compatibility
        self.validate_options(options)

        if not audio_bytes or len(audio_bytes) == 0:
            raise ValueError("Audio file is empty (0 bytes). Browser recording or file selection produced an empty audio stream.")

        client = self._get_client()
        start_time = time.perf_counter()

        # Detect real MIME type and extension from binary headers
        detected_mime, file_ext = detect_audio_format(audio_bytes, original_filename, mime_type)
        logger.info(
            f"STT: Processing file '{original_filename}' ({len(audio_bytes)} bytes) "
            f"-> detected MIME: '{detected_mime}', extension: '{file_ext}'"
        )

        # Step 2: Write audio to temporary file with correct extension
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=file_ext)
        temp_file_path = temp_file.name
        try:
            temp_file.write(audio_bytes)
            temp_file.flush()
        finally:
            temp_file.close()

        uploaded_file = None
        try:
            # Step 3: Upload audio using the Gemini Files API
            try:
                uploaded_file = client.files.upload(
                    file=temp_file_path,
                    config={"mime_type": detected_mime}
                )
                logger.info(f"STT: Uploaded to Gemini Files API: name={uploaded_file.name}, uri={uploaded_file.uri}")
            except Exception as upload_exc:
                logger.error(f"STT: Gemini file upload failed: {upload_exc}")
                raise STTUploadError(f"Gemini Files API upload failed: {str(upload_exc)}")

            # Step 4: Build transcription configuration
            transcription_config = {}

            # Language code: omit or empty list for auto detection
            if options.language and options.language.lower() != "auto":
                transcription_config["language_codes"] = [options.language]
            else:
                transcription_config["language_codes"] = []

            # Mode handling
            if options.mode == TranscriptionMode.SMART:
                transcription_config["mode"] = "smart"
            else:
                # Verbatim mode with optional diarization and timestamps
                mode_obj = {"type": "verbatim"}
                if options.enable_diarization:
                    mode_obj["diarization_mode"] = "speaker"
                if options.enable_word_timestamps:
                    mode_obj["timestamp_granularities"] = ["word"]
                transcription_config["mode"] = mode_obj

            # Custom vocabulary (only valid when no diarization and no timestamps)
            if options.custom_vocabulary and len(options.custom_vocabulary) > 0:
                transcription_config["custom_vocabulary"] = options.custom_vocabulary

            generation_config = {
                "transcription_config": transcription_config
            }

            # Step 5: Send uploaded audio to gemini-3.5-transcribe using Interactions API
            try:
                interaction = client.interactions.create(
                    model=options.model,
                    input=[
                        {
                            "type": "audio",
                            "uri": uploaded_file.uri,
                            "mime_type": uploaded_file.mime_type or detected_mime,
                        }
                    ],
                    generation_config=generation_config,
                )
            except Exception as trans_exc:
                logger.error(f"STT: Gemini interactions.create failed: {trans_exc}")
                raise STTTranscriptionError(f"Gemini transcription request failed: {str(trans_exc)}")

            elapsed_ms = (time.perf_counter() - start_time) * 1000

            # Verify interaction status
            inter_status = getattr(interaction, "status", "unknown")
            logger.info(f"STT: Interaction completed with status: {inter_status}, latency: {elapsed_ms:.1f}ms")

            if inter_status in ["failed", "cancelled"]:
                err_details = getattr(interaction, "errors", None) or "Interaction did not complete"
                raise STTTranscriptionError(f"Gemini transcription returned status '{inter_status}': {err_details}")

            # Step 6: Parse transcript and annotations
            raw_transcript = getattr(interaction, "output_text", None)
            if not raw_transcript:
                # Fallback to concatenate text from steps if output_text is empty
                text_parts = []
                for step in getattr(interaction, "steps", []) or []:
                    content_list = getattr(step, "content", None) or (step.get("content") if isinstance(step, dict) else [])
                    for content in content_list or []:
                        c_text = getattr(content, "text", None) or (content.get("text") if isinstance(content, dict) else None)
                        if c_text:
                            text_parts.append(c_text)
                raw_transcript = " ".join(text_parts).strip() if text_parts else ""

            # Extract word-level annotations (timestamps and speakers)
            word_timestamps: List[WordTimestamp] = []
            for step in getattr(interaction, "steps", []) or []:
                content_list = getattr(step, "content", None) or (step.get("content") if isinstance(step, dict) else [])
                for content in content_list or []:
                    ann_list = getattr(content, "annotations", None) or (content.get("annotations") if isinstance(content, dict) else [])
                    for ann in ann_list or []:
                        ann_type = getattr(ann, "type", None) or (ann.get("type") if isinstance(ann, dict) else None)
                        if ann_type == "word_info":
                            w_text = getattr(ann, "text", None) or (ann.get("text") if isinstance(ann, dict) else "")
                            w_speaker = getattr(ann, "speaker", None) or (ann.get("speaker") if isinstance(ann, dict) else None)
                            w_start = getattr(ann, "start_offset", None) or (ann.get("start_offset") if isinstance(ann, dict) else None)
                            w_end = getattr(ann, "end_offset", None) or (ann.get("end_offset") if isinstance(ann, dict) else None)
                            word_timestamps.append(
                                WordTimestamp(
                                    word=w_text,
                                    speaker=w_speaker,
                                    start_offset=str(w_start) if w_start is not None else None,
                                    end_offset=str(w_end) if w_end is not None else None,
                                )
                            )

            # If raw_transcript is empty but word_timestamps exist, recover transcript
            if not raw_transcript and word_timestamps:
                raw_transcript = " ".join([w.word for w in word_timestamps])

            # Build diarized segments if diarization was requested
            diarized_segments: List[DiarizedSegment] = []
            if options.enable_diarization and word_timestamps:
                current_speaker = None
                current_words: List[str] = []
                current_start = None
                current_end = None

                for wt in word_timestamps:
                    spk = wt.speaker or "Speaker"
                    if spk != current_speaker:
                        if current_speaker is not None and current_words:
                            diarized_segments.append(
                                DiarizedSegment(
                                    speaker=current_speaker,
                                    start_offset=current_start,
                                    end_offset=current_end,
                                    text=" ".join(current_words),
                                )
                            )
                        current_speaker = spk
                        current_words = [wt.word]
                        current_start = wt.start_offset
                        current_end = wt.end_offset
                    else:
                        current_words.append(wt.word)
                        current_end = wt.end_offset

                if current_speaker is not None and current_words:
                    diarized_segments.append(
                        DiarizedSegment(
                            speaker=current_speaker,
                            start_offset=current_start,
                            end_offset=current_end,
                            text=" ".join(current_words),
                        )
                    )

            if not raw_transcript:
                logger.warning(
                    f"STT: Gemini returned empty transcript for file '{original_filename}' "
                    f"({len(audio_bytes)} bytes, format={detected_mime}). Audio may be silent or below speech threshold."
                )

            return STTResponse(
                transcript=raw_transcript or "(No speech detected in audio file)",
                detected_language=options.language if options.language != "auto" else "Auto-detected",
                diarized_segments=diarized_segments,
                word_timestamps=word_timestamps if options.enable_word_timestamps else [],
                latency_ms=round(elapsed_ms, 2),
                model_used=options.model,
                audio_duration_seconds=None,
            )

        finally:
            # Clean up local temporary file
            if os.path.exists(temp_file_path):
                try:
                    os.unlink(temp_file_path)
                except Exception:
                    pass

            # Clean up remote file from Gemini Files API
            if uploaded_file and hasattr(uploaded_file, "name"):
                try:
                    client.files.delete(name=uploaded_file.name)
                    logger.info(f"STT: Cleaned up remote file from Files API: {uploaded_file.name}")
                except Exception as del_exc:
                    logger.warning(f"STT: Failed to delete remote file {uploaded_file.name}: {del_exc}")


stt_service = STTService()
