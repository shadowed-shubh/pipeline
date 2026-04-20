# 🚀 Auralysis Pipeline
### FastAPI Orchestrator — Medical AI Backend

> The central controller of the Auralysis platform. Receives images, runs the full AI pipeline, and returns diagnosis results with voice output.

[![FastAPI](https://img.shields.io/badge/FastAPI-0.110.0-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com)
[![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=flat-square&logo=python)](https://python.org)
[![Render](https://img.shields.io/badge/Deployed-Render-46E3B7?style=flat-square)](https://render.com)
[![Supabase](https://img.shields.io/badge/DB-Supabase-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com)
[![Groq](https://img.shields.io/badge/LLM-Groq-6B46C1?style=flat-square)](https://groq.com)

**Live API:** `https://pipeline-1-ch5e.onrender.com`  
**Docs:** `https://pipeline-1-ch5e.onrender.com/docs`

---

## 📋 Table of Contents

- [What This Service Does](#what-this-service-does)
- [Pipeline Flow](#pipeline-flow)
- [File Structure](#file-structure)
- [API Reference](#api-reference)
- [Environment Variables](#environment-variables)
- [Local Setup](#local-setup)
- [Deployment](#deployment)
- [Database](#database)
- [Monitoring](#monitoring)

---

## What This Service Does

This is the brain of the Auralysis platform. It:

1. **Receives** an MRI or X-ray image from the mobile/web client
2. **Forwards** it to the ML inference API for disease prediction
3. **Generates** a full structured medical report using Groq LLaMA 3.1
4. **Simplifies** it into patient-friendly language using Gemini 2.0 Flash
5. **Converts** the summary to audio using gTTS
6. **Stores** results in Supabase PostgreSQL
7. **Emits** metrics to Datadog
8. **Returns** everything to the client in one response

Additionally handles:
- Patient and doctor registration + JWT authentication
- Scan history storage and retrieval
- Doctor directory with specialty filtering
- AI chatbot powered by Groq
- Doctor dashboard data

---

## Pipeline Flow

```
                    Client (Flutter / React)
                           │
                    POST /diagnose
                    multipart/form-data
                    file=<image>
                           │
                           ▼
                  ┌─────────────────┐
                  │   FastAPI App   │
                  │   (app.py)      │
                  └────────┬────────┘
                           │
                    Step 1 │ Forward image
                           ▼
              ┌────────────────────────┐
              │   ML Inference API     │
              │   (Render)             │
              │   EfficientNetV2B0     │
              │   TensorFlow 2.15      │
              │                        │
              │   Returns:             │
              │   • prediction (str)   │
              │   • confidence (float) │
              │   • class_probs (dict) │
              └────────────┬───────────┘
                           │
                    Step 2 │ Generate report
                           ▼
              ┌────────────────────────┐
              │   Groq LLaMA 3.1 8B   │
              │   llama-3.1-8b-instant │
              │                        │
              │   Returns JSON:        │
              │   • disease            │
              │   • severity           │
              │   • explanation        │
              │   • symptoms           │
              │   • next_steps         │
              │   • emergency_signs    │
              │   • specialist         │
              │   • patient_summary    │
              └────────────┬───────────┘
                           │
               ┌───────────┴───────────┐
        Step 3 │                       │ Step 3
    (parallel) │                       │ (parallel)
               ▼                       ▼
  ┌────────────────────┐  ┌────────────────────────┐
  │  Gemini 2.0 Flash  │  │        gTTS            │
  │                    │  │                        │
  │  Simplifies report │  │  Converts summary      │
  │  into plain        │  │  to MP3 audio file     │
  │  English for       │  │  doctor_report.mp3     │
  │  patient           │  │                        │
  └────────┬───────────┘  └────────────┬───────────┘
           │                           │
           └─────────────┬─────────────┘
                         │
                  Step 4 │ Emit metrics
                         ▼
              ┌────────────────────────┐
              │       Datadog          │
              │                        │
              │  medical_ai.request    │
              │  medical_ai.latency    │
              │  medical_ai.gemini.*   │
              │  medical_ai.voice.*    │
              └────────────┬───────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │     JSON Response      │
              │                        │
              │  {                     │
              │    prediction,         │
              │    confidence,         │
              │    medical_report,     │
              │    patient_summary,    │
              │    voice_report_url    │
              │  }                     │
              └────────────────────────┘
```

---

## File Structure

```
Medical_project_datadog_elevenlabs/
│
├── app.py              # FastAPI app, diagnose route, AI pipeline
├── routers.py          # Auth, history, doctors, chat endpoints
├── database.py         # SQLAlchemy models + Supabase connection
├── auth.py             # JWT creation/verification, bcrypt hashing
│
├── requirements.txt    # Python dependencies
├── runtime.txt         # python-3.11.0 (forces Render to use 3.11)
├── Procfile            # web: uvicorn app:app --host 0.0.0.0 --port $PORT
│
├── .env                # API keys (never commit this)
├── .gitignore          # Excludes .env, __pycache__, *.db
│
└── doctor_report.mp3   # Generated voice file (ephemeral on Render)
```

---

## API Reference

### Base URL
```
https://pipeline-1-ch5e.onrender.com
```

Interactive docs: `https://pipeline-1-ch5e.onrender.com/docs`

---

### Public Endpoints

#### `GET /`
Health check.
```json
{
  "status": "running",
  "service": "Medical AI",
  "routes": ["/diagnose", "/voice-report"]
}
```

---

#### `POST /register`
Register a new patient.

**Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepass",
  "age": "25",
  "blood_group": "O+"
}
```

**Response:**
```json
{ "message": "User registered successfully" }
```

---

#### `POST /register-doctor`
Register a new doctor.

**Body:**
```json
{
  "name": "Dr. Sarah Jenkins",
  "email": "sarah@hospital.com",
  "password": "securepass",
  "specialty": "Pulmonologist",
  "hospital": "City General Hospital",
  "phone": "+91 9999999999",
  "locality": "Pune"
}
```

---

#### `POST /login`
Authenticate patient, returns JWT.

**Body:**
```json
{ "email": "john@example.com", "password": "securepass" }
```

**Response:**
```json
{
  "access_token": "eyJ...",
  "token_type": "bearer",
  "role": "patient",
  "user": {
    "name": "John Doe",
    "email": "john@example.com",
    "age": "25",
    "blood_group": "O+"
  }
}
```

---

#### `POST /login-doctor`
Authenticate doctor, returns JWT with `role: "doctor"`.

---

#### `GET /doctors?specialty=Pulmonologist`
List all doctors. Optional `specialty` filter.

**Response:**
```json
[
  {
    "id": 1,
    "name": "Dr. Sarah Jenkins",
    "specialty": "Pulmonologist",
    "hospital": "City General Hospital",
    "phone": "+1 555-0100",
    "locality": "Downtown"
  }
]
```

---

#### `POST /chat`
AI chatbot. Powered by Groq LLaMA 3.1.

**Body:**
```json
{
  "message": "What does pneumonia mean?",
  "context": "optional report JSON string"
}
```

**Response:**
```json
{ "response": "Pneumonia is an infection in your lungs..." }
```

---

### Protected Endpoints
> Require `Authorization: Bearer <token>` header

#### `POST /diagnose`
Main pipeline endpoint. Upload image → full diagnosis.

**Form Data:**
```
file: <image file> (JPG, PNG)
```

**Response:**
```json
{
  "prediction": "chest_pneumonia",
  "confidence": 0.73,
  "medical_report": {
    "disease": "chest_pneumonia",
    "confidence_score": "73.11%",
    "severity_assessment": "Moderate",
    "detailed_explanation": "...",
    "possible_symptoms": ["cough", "fever", "difficulty breathing"],
    "clinical_significance": "...",
    "recommended_next_steps": ["chest X-ray", "blood cultures"],
    "specialist_to_consult": "Pulmonologist",
    "emergency_signs": ["difficulty breathing", "severe chest pain"],
    "patient_friendly_summary": "...",
    "disclaimer": "AI assistance, not a confirmed diagnosis."
  },
  "patient_summary": "You have pneumonia...",
  "voice_report_url": "/voice-report"
}
```

---

#### `GET /voice-report`
Download generated voice MP3.

Returns `audio/mpeg` file.

---

#### `POST /history`
Save a scan result to history.

**Body:**
```json
{
  "disease": "chest_pneumonia",
  "confidence": 0.73,
  "report_summary": "{...full report JSON...}",
  "voice_url": "/voice-report"
}
```

---

#### `GET /history`
Get all scans for authenticated user.

**Response:**
```json
[
  {
    "id": 1,
    "disease": "chest_pneumonia",
    "confidence": 0.73,
    "date": "2026-04-17 21:40:50",
    "report_summary": "{...}",
    "voice_url": "/voice-report"
  }
]
```

---

#### `GET /doctor/all-reports`
Get all patient reports (doctor only).

---

## Environment Variables

Create a `.env` file in the project root:

```env
# LLM Services
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxx
GEMINI_API_KEY=AIzaxxxxxxxxxxxxxxxxxxxxxxxx

# Database (Supabase — use connection pooler URL)
DATABASE_URL=postgresql://postgres.xxxxx:password@aws-x.pooler.supabase.com:6543/postgres

# Monitoring (optional)
DATADOG_API_KEY=xxxxxxxxxxxxxxxxxxxx
DATADOG_APP_KEY=xxxxxxxxxxxxxxxxxxxx
DD_SITE=us5.datadoghq.com
```

> **Never commit `.env` to git.** It is listed in `.gitignore`.

---

## Local Setup

### Requirements
- Python 3.11 (use Miniconda on Arch Linux)
- Supabase project with tables created
- Groq API key (free at groq.com)
- Gemini API key (free at aistudio.google.com)

### Steps

```bash
# 1. Clone
git clone https://github.com/Shreyas1534/Medical_project_datadog_elevenlabs
cd Medical_project_datadog_elevenlabs

# 2. Create conda env
conda create -n orchestrator python=3.11 -y
conda activate orchestrator

# 3. Install dependencies
pip install -r requirements.txt

# 4. Create .env (fill in your keys)
cp .env.example .env
nano .env

# 5. Run
python -m uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

> ⚠️ Use `python -m uvicorn` not bare `uvicorn` — on Arch Linux the pipx uvicorn runs on system Python 3.14 which breaks imports.

### Test it's working

```bash
# Health check
curl http://localhost:8000/

# Register user
curl -X POST http://localhost:8000/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"t@t.com","password":"pass123","age":"25","blood_group":"O+"}'

# Full diagnosis (replace with real image path)
curl -X POST http://localhost:8000/diagnose \
  -F "file=@/path/to/xray.jpg" \
  | python -m json.tool
```

---

## Deployment

Deployed on **Render** (free tier).

### Render Configuration

| Setting | Value |
|---------|-------|
| Runtime | Python 3.11 (via `runtime.txt`) |
| Build Command | `pip install -r requirements.txt` |
| Start Command | From `Procfile` |
| Port | Auto-assigned via `$PORT` |

### Procfile
```
web: uvicorn app:app --host 0.0.0.0 --port $PORT
```

### runtime.txt
```
python-3.11.0
```

### Environment Variables on Render
Set all variables from [Environment Variables](#environment-variables) in:
`Render Dashboard → Your Service → Environment`

### Keep Alive (Important!)
Render free tier sleeps after 15 minutes. Set up a cron ping at [cron-job.org](https://cron-job.org):
- URL: `https://pipeline-1-ch5e.onrender.com`
- Interval: Every 10 minutes
- This prevents cold starts during demos

---

## Database

Uses **Supabase** (hosted PostgreSQL) via SQLAlchemy ORM.

### Tables

**users**
| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER | Primary key |
| name | VARCHAR | Patient name |
| email | VARCHAR | Unique |
| password_hash | VARCHAR | bcrypt hashed |
| age | VARCHAR | |
| blood_group | VARCHAR | A+, B+, O+, etc |

**scan_history**
| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER | Primary key |
| user_id | INTEGER | FK → users.id |
| disease | VARCHAR | Predicted class |
| confidence | FLOAT | 0.0 to 1.0 |
| date | VARCHAR | Timestamp string |
| report_summary | TEXT | Full JSON report |
| voice_url | VARCHAR | Nullable |

**doctors**
| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER | Primary key |
| name | VARCHAR | |
| specialty | VARCHAR | |
| hospital | VARCHAR | |
| phone | VARCHAR | |
| locality | VARCHAR | |
| email | VARCHAR | Nullable (for login) |
| password_hash | VARCHAR | Nullable |

### Connection
Use Supabase **connection pooler** URL (port 6543), not the direct URL (port 5432).
Render free tier doesn't support IPv6 which the direct URL uses.

```python
# ✅ Correct — pooler URL
DATABASE_URL=postgresql://postgres.xxxxx:pass@aws-x.pooler.supabase.com:6543/postgres

# ❌ Wrong — direct URL (IPv6, fails on Render free)
DATABASE_URL=postgresql://postgres:pass@db.xxxxx.supabase.co:5432/postgres
```

---

## Monitoring

Datadog metrics emitted on each request:

| Metric | Type | Description |
|--------|------|-------------|
| `medical_ai.request` | count | Total requests to /diagnose |
| `medical_ai.latency` | gauge | End-to-end response time (ms) |
| `medical_ai.gemini.request` | count | Gemini API calls |
| `medical_ai.gemini.error` | count | Gemini failures |
| `medical_ai.voice.success` | count | Successful TTS generations |
| `medical_ai.voice.error` | count | TTS failures |
| `medical_ai.error` | count | Total pipeline errors |

All metrics tagged with: `env:prod`, `service:medical_ai`, `runtime:fastapi`

Datadog is optional — if keys are missing, metrics are skipped gracefully.

---

## Dependencies

```
fastapi==0.110.0          # Web framework
uvicorn==0.29.0           # ASGI server
requests==2.31.0          # HTTP client for ML API calls
python-dotenv==1.0.1      # .env file loading
groq==1.0.0               # Groq LLaMA API client
google-genai              # Gemini API client
gtts                      # Google Text-to-Speech
sqlalchemy                # ORM
psycopg2-binary==2.9.9    # PostgreSQL driver
bcrypt==4.1.3             # Password hashing
pyjwt==2.8.0              # JWT tokens
python-multipart==0.0.7   # File upload support
```

---

## Known Issues & Notes

- **Render cold starts:** First request after 15min inactivity takes 30-60s. Use cron ping to prevent.
- **gTTS requires internet:** TTS calls Google's API. Works on Render, may fail in offline environments.
- **SQLite vs PostgreSQL:** Local dev can use SQLite by setting `DATABASE_URL=sqlite:///./auralysis.db` and changing engine args. Production uses Supabase.
- **Python 3.14 incompatibility:** TensorFlow, passlib, and psycopg2 all break on 3.14. Always use Python 3.11 via `runtime.txt`.
