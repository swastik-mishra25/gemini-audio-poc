"""
Application Configuration and Constants.
Ensures API keys and credentials reside strictly in the backend environment.
"""

import os
import json
from typing import List, Union
from dotenv import load_dotenv
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # API Credentials - Kept strictly on the backend
    GEMINI_API_KEY: str = ""

    # Server Settings
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    ENVIRONMENT: str = "development"

    # CORS Settings - accepts comma-separated string or list or JSON string
    CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]

    # Available STT Models
    AVAILABLE_STT_MODELS: List[str] = [
        "gemini-3.5-transcribe",
    ]
    DEFAULT_STT_MODEL: str = "gemini-3.5-transcribe"

    # Available TTS Models
    AVAILABLE_TTS_MODELS: List[str] = [
        "gemini-3.8-flash-tts",
        "gemini-3.8-flash-lite-tts",
    ]
    DEFAULT_TTS_MODEL: str = "gemini-3.8-flash-tts"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @property
    def cors_origins_list(self) -> List[str]:
        """Parsed list of allowed origins for FastAPI CORSMiddleware."""
        if isinstance(self.CORS_ORIGINS, list):
            return self.CORS_ORIGINS
        if isinstance(self.CORS_ORIGINS, str):
            try:
                parsed = json.loads(self.CORS_ORIGINS)
                if isinstance(parsed, list):
                    return [str(o) for o in parsed]
            except Exception:
                pass
            return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]
        return ["http://localhost:5173", "http://127.0.0.1:5173"]

    def get_api_key(self) -> str:
        """
        Dynamically returns the configured Gemini API key from .env or environment.
        Supports hot-reloading if backend/.env is updated while running.
        """
        load_dotenv(dotenv_path=".env", override=True)
        key = (
            os.getenv("GEMINI_API_KEY")
            or os.getenv("GOOGLE_API_KEY")
            or self.GEMINI_API_KEY
            or ""
        ).strip()
        if key == "your_gemini_api_key_here":
            return ""
        return key


settings = Settings()
