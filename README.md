# Gemini Audio POC - STT & TTS Evaluation Studio

A full-stack evaluation proof-of-concept (POC) built to independently evaluate:
1. **Speech-to-Text (STT)** (`gemini-3.5-transcribe`)
2. **Text-to-Speech (TTS)** (`gemini-3.8-flash-tts` & `gemini-3.8-flash-lite-tts`)

> [!IMPORTANT]
> **Non-Live RESTful Architecture**: This project uses the official `google-genai` Python SDK via the Gemini Files API and Interactions API. It explicitly does **NOT** use the Gemini Live API or WebSockets.

---

## 🏛️ System Architecture

```
                    +------------------------------------------+
                    |             React + Vite UI              |
                    |  - 3 Sections: STT, TTS, Configuration   |
                    |  - Incompatibility Prevention            |
                    |  - Zero API Keys in Browser Frontend     |
                    +--------------------+---------------------+
                                         | HTTP REST
                                         v
                    +------------------------------------------+
                    |          FastAPI Backend Service         |
                    |           (app/main.py: /api)            |
                    +---------+----------------------+---------+
                              |                      |
            +-----------------+                      +-----------------+
            |                                                          |
            v                                                          v
+-------------------------------+              +-------------------------------+
|      STT Module (Isolated)    |              |      TTS Module (Isolated)    |
| - Route: /api/stt/transcribe  |              | - Route: /api/tts/synthesize  |
| - Service: STTService         |              | - Service: TTSService         |
| - Schemas: schemas/stt.py     |              | - Schemas: schemas/tts.py     |
| - Model:                      |              | - Models:                     |
|   gemini-3.5-transcribe       |              |   gemini-3.8-flash-tts        |
| - Files API Upload & Cleanup  |              |   gemini-3.8-flash-lite-tts   |
| - Latency Measurement (ms)    |              | - Latency Measurement (ms)    |
+---------------+---------------+              +---------------+---------------+
                |                                              |
                +----------------------+-----------------------+
                                       | official google-genai SDK
                                       v
                        +------------------------------+
                        |      Google Gemini API       |
                        | (Files API, Interactions API)|
                        +------------------------------+
```

---

## 🎙️ Speech-to-Text (STT) Module

### Capabilities
- **Model**: `gemini-3.5-transcribe`
- **Files API Integration**: Uploads recording or audio file via `client.files.upload()`, retrieves file URI, and cleans up remote file upon completion.
- **Interactions API Execution**: Calls `client.interactions.create()` with audio URI payload.
- **Language Detection & Selection**: Dynamic auto-detection (code-switching) or explicit BCP-47 codes (`en-US`, `es-ES`, `fr-FR`, `de-DE`, `ja-JP`, `hi-IN`, `zh-CN`, etc.).
- **Transcription Modes**:
  - `verbatim` (Default): Exact word-for-word fidelity including pauses and filler words.
  - `smart`: Disfluency removal, grammatical cleanup, inline self-corrections, and structured formatting (numbers/dates).
- **Speaker Diarization**: Tags individual speaker turns (`spk_1`, `spk_2`) with timestamps.
- **Word-Level Timestamps**: Exact start and end offsets for each transcribed word.
- **Custom Vocabulary**: Biases recognition towards domain terms, acronyms, or proper names.
- **Latency Measurement**: End-to-end processing duration measured and displayed in milliseconds.

### 🛡️ Compatibility Rules & Prevention
The backend and frontend strictly enforce Gemini API compatibility constraints:
| Configuration Combination | Compatibility | Backend Action | UI Behavior |
|---|---|---|---|
| `smart` mode + Speaker Diarization | ❌ Incompatible | Rejects with `400 Bad Request` | Diarization toggle is disabled |
| `smart` mode + Word Timestamps | ❌ Incompatible | Rejects with `400 Bad Request` | Timestamps toggle is disabled |
| Custom Vocabulary + Speaker Diarization | ❌ Incompatible | Rejects with `400 Bad Request` | Diarization toggle is disabled |
| Custom Vocabulary + Word Timestamps | ❌ Incompatible | Rejects with `400 Bad Request` | Timestamps toggle is disabled |
| `verbatim` mode + Diarization + Word Timestamps | ✅ Supported | Processes successfully | Available simultaneously |

---

## 🔊 Text-to-Speech (TTS) Module

### Capabilities
- **Models**:
  - `gemini-3.8-flash-tts`: Highest fidelity, expressive vocal cadence and timbre.
  - `gemini-3.8-flash-lite-tts`: Ultra low-latency, lightweight synthesis for fast turnaround.
- **Voice Personas**:
  - `Aoede`: Warm, breezy, and engaging (Female)
  - `Charon`: Deep, authoritative, and informative (Male)
  - `Fenrir`: Energetic, excitable, and direct (Male)
  - `Kore`: Firm, clear, and expressive (Female)
  - `Puck`: Friendly, upbeat, and animated (Neutral)
  - `Zephyr`: Bright, dynamic, and clear (Neutral)
  - `Leda`: Youthful, soft, and approachable (Female)
  - `Orus`: Firm, confident, and steady (Male)
- **Director's Chair Style Prompting**: Natural language style guidance (e.g., *"Whispering excitedly"*, *"Empathetic support agent"*, *"Formal news anchor"*).
- **Playback & Export**: In-browser audio player with scrubbing timeline and direct WAV download.
- **Latency Measurement**: End-to-end generation latency tracked and displayed in milliseconds.

---

## ⚙️ Configuration & Security

- **Strict Key Isolation**: The browser frontend never has access to `GEMINI_API_KEY`.
- **Backend Key Management**: Keys are loaded exclusively by the backend from `backend/.env` or system environment.
- **Hot Reloading**: Editing `backend/.env` dynamically updates key status without needing a server restart.
- **Diagnostics**: `/api/config/status` provides model availability and health without leaking credentials.

---

## 📁 Repository Layout

```
gemini-audio-poc/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── routes/
│   │   │       ├── stt.py         # STT routes (/api/stt/transcribe, /models, /languages)
│   │   │       ├── tts.py         # TTS routes (/api/tts/synthesize, /models, /voices)
│   │   │       └── config.py      # System diagnostics (/api/config/status)
│   │   ├── core/
│   │   │   └── config.py          # Settings, env management, dynamic key loader
│   │   ├── schemas/
│   │   │   ├── stt.py             # STT Pydantic schemas, WordTimestamp, DiarizedSegment
│   │   │   ├── tts.py             # TTS Pydantic schemas, VoiceMetadata
│   │   │   └── config.py          # Config models
│   │   ├── services/
│   │   │   ├── stt_service.py     # Independent STT business logic (Files API + Interactions API)
│   │   │   └── tts_service.py     # Independent TTS business logic (Interactions API audio)
│   │   └── main.py                # FastAPI entry point & CORS configuration
│   ├── .env.example               # Backend environment template
│   ├── .env                       # Local backend secrets (gitignored)
│   ├── requirements.txt           # Python dependencies (google-genai, fastapi, uvicorn)
│   └── README.md
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/            # Header, TabNavigation, LatencyCard, AudioPlayer
│   │   │   ├── stt/               # STTSection, AudioRecorder, AudioUploader, STTOptions, TranscriptDisplay
│   │   │   ├── tts/               # TTSSection, TextInput, TTSOptions, TTSPlayback
│   │   │   └── config/            # ConfigSection (Security & models)
│   │   ├── services/              # Isolated API services (sttService, ttsService, configService)
│   │   ├── types/                 # TypeScript interfaces (stt.ts, tts.ts, config.ts)
│   │   ├── App.tsx                # Tab state & layout orchestration
│   │   ├── main.tsx               # React DOM entry
│   │   └── index.css              # Modern dark-mode audio studio design system
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts             # Dev proxy forwarding /api to http://127.0.0.1:8000
│
└── README.md
```

---

## 🚀 Setup & Execution Guide

### Step 1: Configure Backend Environment
Open `backend/.env` and insert your Gemini API Key:
```env
GEMINI_API_KEY=your_actual_gemini_api_key_here
HOST=0.0.0.0
PORT=8000
ENVIRONMENT=development
CORS_ORIGINS=["http://localhost:5173","http://127.0.0.1:5173"]
```

### Step 2: Launch Backend Service
```powershell
cd d:\gemini-audio-poc\backend
.\venv\Scripts\activate
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
API documentation is available at [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs).

### Step 3: Launch Frontend
In a separate terminal:
```powershell
cd d:\gemini-audio-poc\frontend
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🧪 Verified Test Results

- **STT Endpoint Compatibility Tests**:
  - `Smart + Diarization`: Correctly rejected (`400 Bad Request`).
  - `Smart + Word Timestamps`: Correctly rejected (`400 Bad Request`).
  - `Custom Vocabulary + Diarization`: Correctly rejected (`400 Bad Request`).
  - `Custom Vocabulary + Timestamps`: Correctly rejected (`400 Bad Request`).
- **STT Audio Pipeline & Format Verification**:
  - `Known-Good WAV Upload`: Verified with 294 KB WAV file (`gemini-3.5-transcribe` returned verbatim transcript: `"Hello world. This is a clear speech transcription evaluation test."` with 10 word-level timestamps).
  - `Browser WebM Recording`: Verified with binary magic-byte detection (`\x1aE\xdf\xa3`) correctly identified as `audio/webm`, uploaded to Gemini Files API with matched MIME type, yielding accurate transcription.
  - `Zero-Byte / Missing File Safeguards`: Verified explicit HTTP 400 rejection with stage-specific error messages distinguishing between empty audio, missing parts, upload failures, and transcription failures.
  - `Frontend Microphone Live Meter`: Integrated Web Audio API `AudioContext` with `AnalyserNode` for live visual input volume feedback and buffer chunk flushing via `mediaRecorder.requestData()` before stopping.
- **TTS Endpoint Verification**:
  - `gemini-3.8-flash-tts`: Synthesized 294 KB WAV audio (`200 OK`, latency ~1793ms).
  - `gemini-3.8-flash-lite-tts`: Synthesized 259 KB WAV audio (`200 OK`, latency ~1365ms).
- **Frontend Build Test**:
  - `npm run build` (`tsc && vite build`) completed cleanly with zero errors or bundle warnings.
