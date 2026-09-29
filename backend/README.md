# Gemini Audio POC - Backend Service

FastAPI-based backend for independently evaluating:
1. **Speech-to-Text (STT)** (`gemini-3.5-transcribe`)
2. **Text-to-Speech (TTS)** (`gemini-3.8-flash-tts`, `gemini-3.8-flash-lite-tts`)

## Architecture Principles
- **Strict Module Isolation**: STT and TTS have independent routes (`/api/stt/*`, `/api/tts/*`), schemas (`schemas/stt.py`, `schemas/tts.py`), and service layers (`services/stt_service.py`, `services/tts_service.py`).
- **No Gemini Live API**: Uses non-live RESTful audio interfaces.
- **Backend-Only Secrets**: The frontend never has access to `GEMINI_API_KEY`. The backend validates and proxies all requests.

## Directory Structure
```
backend/
├── app/
│   ├── api/
│   │   └── routes/
│   │       ├── stt.py         # STT endpoints (/api/stt/transcribe, /api/stt/models, /api/stt/languages)
│   │       ├── tts.py         # TTS endpoints (/api/tts/synthesize, /api/tts/models, /api/tts/voices)
│   │       └── config.py      # Diagnostics and model capabilities (/api/config/status)
│   ├── core/
│   │   └── config.py          # App settings & model definitions
│   ├── schemas/
│   │   ├── stt.py             # STT request/response models & options
│   │   ├── tts.py             # TTS request/response models & options
│   │   └── config.py          # Config models
│   ├── services/
│   │   ├── stt_service.py     # Independent STT business logic & SDK integration
│   │   └── tts_service.py     # Independent TTS business logic & SDK integration
│   └── main.py                # FastAPI entry point & CORS
├── .env.example
└── requirements.txt
```

## Setup & Running
```bash
# Create virtual environment
python -m venv venv
.\venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your GEMINI_API_KEY

# Run server
uvicorn app.main:app --reload --port 8000
```
