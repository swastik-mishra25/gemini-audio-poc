# Gemini Audio POC - STT & TTS Evaluation Studio

A full-stack evaluation proof-of-concept (POC) built to independently evaluate and benchmark:
1. **Speech-to-Text (STT)** using `gemini-3.5-transcribe` via Gemini Files API + Interactions API.
2. **Text-to-Speech (TTS)** using `gemini-3.8-flash-tts` & `gemini-3.8-flash-lite-tts` with natural language style prompting.

> [!IMPORTANT]
> **Non-Live RESTful Architecture**: This project uses the official `google-genai` Python SDK via the Gemini Files API and Interactions API. It explicitly does **NOT** use the Gemini Live API or WebSockets, guaranteeing high stability and deterministic batch/REST execution.

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
- **Cross-Browser Audio Recording**: Web Audio API analyser with real-time volume VU metering, capability detection, and auto-chunk flushing.

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
- **Director's Chair Style Prompting**: Natural language style guidance (e.g., *"Whispering excitedly"*, *"Empathetic customer support agent"*, *"Formal news anchor"*).
- **Playback & Export**: In-browser audio player with scrubbing timeline and direct WAV download.
- **Latency Measurement**: End-to-end generation latency tracked and displayed in milliseconds.

---

## ⚙️ Configuration & Security

- **Strict Key Isolation**: The browser frontend never touches or stores the `GEMINI_API_KEY`.
- **Backend Key Management**: Keys are loaded exclusively by the backend from `.env` or system environment variables.
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
│   │   ├── services/              # Isolated API services (sttService, ttsService, configService, apiClient)
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

## 💻 Local Development Setup

### 1. Configure Backend Environment
Create `backend/.env`:
```env
GEMINI_API_KEY=your_actual_gemini_api_key_here
HOST=0.0.0.0
PORT=8000
ENVIRONMENT=development
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

### 2. Start Backend Service
```powershell
cd d:\gemini-audio-poc\backend
# Create virtual environment if needed
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt

# Start FastAPI server
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
- API Docs (Swagger): [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- Health Check: [http://127.0.0.1:8000/api/health](http://127.0.0.1:8000/api/health)

### 3. Start Frontend Development Server
In a separate terminal:
```powershell
cd d:\gemini-audio-poc\frontend
npm install
npm run dev
```
- Open [http://localhost:5173](http://localhost:5173) in your browser.
- Vite automatically proxies `/api/*` to `http://127.0.0.1:8000/api/*`.

---

## ☁️ Cloud Deployment Guide

The project is split into a **FastAPI backend on Render** and a **React frontend on Vercel**.

```
[ User Browser ]
       |
       |  (UI Assets)
       v
[ Vercel Frontend ]
  https://<your-project>.vercel.app
       |
       |  (REST API calls: /api/*)
       v
[ Render Backend ]
  https://<your-service>.onrender.com
       |
       |  (Files API / Interactions API)
       v
[ Google Gemini API ]
```

### Part 1: Deploy Backend on Render

1. Go to [Render Dashboard](https://dashboard.render.com/) and click **New +** $\rightarrow$ **Web Service**.
2. Connect your GitHub repository: `https://github.com/swastik-mishra25/gemini-audio-poc`.
3. Configure the service settings:
   - **Name**: `gemini-audio-poc-backend` (or your preferred name)
   - **Region**: Nearest to your users (e.g., Oregon, Frankfurt, Singapore)
   - **Root Directory**: `backend`
   - **Environment**: `Python 3`
   - **Build Command**:
     ```bash
     pip install -r requirements.txt
     ```
   - **Start Command**:
     ```bash
     uvicorn app.main:app --host 0.0.0.0 --port $PORT
     ```
   - **Instance Type**: `Free`
4. Add **Environment Variables**:
   - `GEMINI_API_KEY`: Your Google Gemini API key.
   - `ENVIRONMENT`: `production`
   - `ALLOWED_ORIGINS`: `https://<your-project>.vercel.app,http://localhost:5173` *(Update with your Vercel URL once created)*
5. Click **Create Web Service** and wait for deployment to complete.
6. Copy your public service URL: `https://<your-service>.onrender.com`.

---

### Part 2: Deploy Frontend on Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard) and click **Add New...** $\rightarrow$ **Project**.
2. Import the `gemini-audio-poc` repository.
3. Configure project settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click edit and select `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Expand **Environment Variables** and add:
   - **Key**: `VITE_API_BASE_URL`
   - **Value**: `https://<your-service>.onrender.com` *(Your Render backend URL)*
5. Click **Deploy**.
6. Once deployed, copy your Vercel domain (e.g., `https://gemini-audio-poc.vercel.app`) and add it to `ALLOWED_ORIGINS` in your Render backend settings.

---

### ⚠️ Cloud Deployment Troubleshooting

#### 1. "Checking backend..." or Initial Request Timeout
- **Cause**: Render's Free Tier spins down web services after 15 minutes of inactivity (cold start).
- **Solution**: The first request after a period of inactivity may take **40–60 seconds** while the container starts. Open `https://<your-service>.onrender.com/api/health` directly in a browser tab to wake the service up, then refresh your Vercel app.

#### 2. CORS Errors
- **Cause**: The frontend origin is not present in Render's `ALLOWED_ORIGINS` or `CORS_ORIGINS`.
- **Solution**: In Render's dashboard under Environment Variables, ensure `ALLOWED_ORIGINS` contains your full Vercel URL without trailing slash:
  ```
  https://<your-project>.vercel.app
  ```

#### 3. 404 on API Routes
- **Cause**: Missing `/api` prefix when calling backend endpoints.
- **Solution**: [`frontend/src/services/apiClient.ts`](file:///D:/gemini-audio-poc/frontend/src/services/apiClient.ts) automatically normalizes `VITE_API_BASE_URL` to ensure `/api` is included whether you provide `https://service.onrender.com` or `https://service.onrender.com/api`.

---

## 🧪 Testing Guide

### 1. Test Text-to-Speech (TTS)
1. Navigate to the **Text-to-Speech (TTS)** tab.
2. Select a model:
   - `gemini-3.8-flash-tts` for high-fidelity natural speech.
   - `gemini-3.8-flash-lite-tts` for lowest latency.
3. Select a voice persona (e.g., *Fenrir*, *Aoede*, *Charon*).
4. (Optional) Provide a style prompt in the Director's Chair (e.g., *"Whispering with excitement"*).
5. Enter text and click **Synthesize Speech**.
6. Verify audio playback and latency display.

### 2. Test Speech-to-Text (STT) - Audio Upload
1. Navigate to the **Speech-to-Text (STT)** tab.
2. Upload a `.wav`, `.mp3`, or `.m4a` file.
3. Select language:
   - **English (`en-US`)** or **Auto Detect**.
4. Choose transcription mode (`verbatim` or `smart`).
5. Click **Transcribe Audio** and review the transcript, timestamps, and latency.

### 3. Test Speech-to-Text (STT) - Microphone Recording
1. In the STT tab, click **Start Recording**.
2. Speak clearly into your microphone while observing the live VU volume meter.
3. Click **Stop Recording**.
4. Use the built-in local audio player to preview your recording before submitting.
5. Click **Transcribe Audio** to verify end-to-end cloud processing.

---

## 📄 License
MIT License. Built for evaluating Google Gemini Audio capabilities with the official `google-genai` SDK.
