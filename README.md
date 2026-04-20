# 🔬 AURALYSIS
### AI-Powered Medical Image Diagnosis Platform

> Upload an MRI or X-ray. Get a full medical report, patient-friendly summary, and doctor-style voice explanation — in seconds.

[![Backend](https://img.shields.io/badge/Backend-FastAPI-009688?style=flat-square&logo=fastapi)](https://pipeline-1-ch5e.onrender.com)
[![ML](https://img.shields.io/badge/ML-TensorFlow-FF6F00?style=flat-square&logo=tensorflow)](https://www.tensorflow.org)
[![LLM](https://img.shields.io/badge/LLM-Groq%20LLaMA%203.1-6B46C1?style=flat-square)](https://groq.com)
[![Database](https://img.shields.io/badge/Database-Supabase-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com)
[![Mobile](https://img.shields.io/badge/Mobile-Flutter-02569B?style=flat-square&logo=flutter)](https://flutter.dev)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Repositories](#repositories)
- [API Endpoints](#api-endpoints)
- [Setup & Running](#setup--running)
- [Database Schema](#database-schema)
- [Screenshots](#screenshots)
- [Team](#team)

---

## Overview

Auralysis is a full-stack medical AI platform that makes complex medical imaging results accessible to patients. It combines computer vision, large language models, and text-to-speech to deliver diagnosis results in plain language — with voice output.

**Problem:** Medical reports are complex and patients can't understand them.  
**Solution:** Upload your scan → AI reads it → you get a simple explanation + voice summary.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                             │
│                                                                 │
│   ┌──────────────────┐          ┌──────────────────────────┐   │
│   │  Flutter Mobile  │          │      React Web App       │   │
│   │   (Auralysis)    │          │    (Auralysis Web)       │   │
│   │                  │          │                          │   │
│   │ • Image Upload   │          │ • Patient Dashboard      │   │
│   │ • Scan History   │          │ • Doctor Dashboard       │   │
│   │ • Voice Playback │          │ • AI Chatbot             │   │
│   │ • Doctors List   │          │ • Multilingual (6 langs) │   │
│   └────────┬─────────┘          └────────────┬─────────────┘   │
└────────────┼───────────────────────────────-─┼─────────────────┘
             │                                  │
             │         HTTPS + JWT Auth         │
             ▼                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                    ORCHESTRATOR LAYER                           │
│              FastAPI (Render) — pipeline-1-ch5e                 │
│                                                                 │
│  POST /diagnose        POST /register      POST /login          │
│  POST /register-doctor POST /login-doctor  POST /chat           │
│  GET  /history         GET  /doctors       GET  /voice-report   │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  Auth (JWT)  │  │  SQLAlchemy  │  │   Datadog Metrics    │  │
│  │  bcrypt hash │  │  ORM Layer   │  │   (monitoring)       │  │
│  └──────────────┘  └──────┬───────┘  └──────────────────────┘  │
└───────────────────────────┼─────────────────────────────────────┘
                            │
              ┌─────────────┼──────────────┐
              │             │              │
              ▼             ▼              ▼
┌─────────────────┐ ┌──────────────┐ ┌─────────────────────────┐
│   AI SERVICES   │ │   DATABASE   │ │     ML INFERENCE        │
│                 │ │              │ │                         │
│ ┌─────────────┐ │ │  Supabase    │ │  TensorFlow SavedModel  │
│ │ Groq LLaMA  │ │ │  PostgreSQL  │ │  EfficientNetV2B0       │
│ │ 3.1 (8B)    │ │ │              │ │                         │
│ │             │ │ │ • users      │ │  6-class prediction:    │
│ │ Medical     │ │ │ • doctors    │ │  • brain_glioma         │
│ │ Report JSON │ │ │ • scan_      │ │  • brain_meningioma     │
│ └─────────────┘ │ │   history    │ │  • brain_normal         │
│                 │ │              │ │  • brain_pituitary      │
│ ┌─────────────┐ │ └──────────────┘ │  • chest_normal         │
│ │Gemini 2.0   │ │                  │  • chest_pneumonia      │
│ │Flash        │ │                  │                         │
│ │             │ │                  │  FastAPI on Render      │
│ │Patient      │ │                  │  POST /predict          │
│ │Summary      │ │                  └─────────────────────────┘
│ └─────────────┘ │
│                 │
│ ┌─────────────┐ │
│ │    gTTS     │ │
│ │             │ │
│ │ Voice MP3   │ │
│ │ Report      │ │
│ └─────────────┘ │
└─────────────────┘
```

### Request Flow

```
User uploads image
       │
       ▼
Flutter/Web sends POST /diagnose (multipart)
       │
       ▼
Orchestrator receives file
       │
       ▼
① ML API (Render) → EfficientNetV2B0 → prediction + confidence
       │
       ▼
② Groq LLaMA 3.1 → structured JSON medical report
       │
       ├──────────────────────┐
       ▼                      ▼
③ Gemini 2.0 Flash      gTTS Voice
  patient summary        MP3 report
  (parallel)             (parallel)
       │                      │
       └──────────┬───────────┘
                  ▼
       Response returned to client
       {prediction, confidence, medical_report,
        patient_summary, voice_report_url}
       │
       ▼
History saved to Supabase
Datadog metrics emitted
```

---

## Features

### 🧠 AI Diagnosis
- Upload MRI or X-ray image (JPG, PNG)
- 6-class disease prediction using EfficientNetV2B0
- Confidence score per prediction
- Full structured medical report via Groq LLaMA 3.1

### 📋 Medical Report
- Severity assessment (Low / Moderate / High)
- Detailed medical explanation
- Possible symptoms list
- Recommended next steps
- Specialist to consult
- Emergency warning signs
- Patient-friendly summary
- AI disclaimer

### 🔊 Voice Report
- Doctor-style audio summary via gTTS
- Playable directly in app and web
- Downloadable as MP3

### 👤 Patient Features
- Register / Login with JWT auth
- Personal scan history
- Download report as PDF
- Find nearby specialist doctors
- Filter doctors by specialty

### 👨‍⚕️ Doctor Features
- Separate doctor login
- View all patient reports
- Patient management dashboard

### 🌐 Web App
- Full React web interface
- 6 language support (EN, HI, MR, TA, TE, BN)
- AI chatbot with voice input/output
- Mobile responsive

### 📊 Monitoring
- Datadog metrics dashboard
- Request count, latency, error tracking
- Per-service metrics (gemini, voice, ML)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile App | Flutter (Dart) |
| Web Frontend | React + Vite + Tailwind CSS |
| Orchestrator API | FastAPI (Python 3.11) |
| ML Inference API | FastAPI + TensorFlow 2.15 |
| ML Model | EfficientNetV2B0 (TensorFlow SavedModel) |
| LLM — Medical Report | Groq LLaMA 3.1 8B Instant |
| LLM — Patient Summary | Google Gemini 2.0 Flash |
| LLM — Chatbot | Groq LLaMA 3.1 8B Instant |
| Text-to-Speech | gTTS (Google Text-to-Speech) |
| Auth | JWT (PyJWT) + bcrypt |
| Database | Supabase (PostgreSQL) |
| ORM | SQLAlchemy |
| Monitoring | Datadog |
| Hosting — Orchestrator | Render |
| Hosting — ML API | Render |
| Internationalization | i18next |

---

## Repositories

| Repo | Description | Language |
|------|-------------|----------|
| [auralysis](https://github.com/Shreyas1534/auralysis) | Flutter mobile app | Dart |
| [Medical_Project](https://github.com/Shreyas1534/Medical_Project) | TensorFlow ML inference API | Python |
| [Medical_project_datadog_elevenlabs](https://github.com/Shreyas1534/Medical_project_datadog_elevenlabs) | FastAPI orchestrator + auth + DB | Python |
| pipeline (web branch) | React web application | JavaScript |

---

## API Endpoints

Base URL: `https://pipeline-1-ch5e.onrender.com`

### Public
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Health check |
| POST | `/register` | Register patient |
| POST | `/register-doctor` | Register doctor |
| POST | `/login` | Patient login → JWT |
| POST | `/login-doctor` | Doctor login → JWT |
| GET | `/doctors` | List doctors (filter by specialty) |
| POST | `/chat` | AI chatbot message |

### Protected (JWT required)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/diagnose` | Upload image → full diagnosis |
| GET | `/voice-report` | Download voice MP3 |
| POST | `/history` | Save scan to history |
| GET | `/history` | Get user scan history |
| GET | `/doctor/all-reports` | Get all patient reports (doctor) |

---

## Setup & Running

### Prerequisites
- Python 3.11 (via Miniconda recommended)
- Flutter 3.x
- Node.js 18+
- Supabase account
- API keys: Groq, Gemini, Datadog (optional)

### ML Inference API (Medical_Project)

```bash
conda create -n ml-api python=3.11 -y
conda activate ml-api

git clone https://github.com/Shreyas1534/Medical_Project
cd Medical_Project

pip install tensorflow==2.15.0
pip install fastapi uvicorn pydantic python-multipart Pillow

python -m uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

### Orchestrator Backend

```bash
conda create -n orchestrator python=3.11 -y
conda activate orchestrator

git clone https://github.com/Shreyas1534/Medical_project_datadog_elevenlabs
cd Medical_project_datadog_elevenlabs

pip install -r requirements.txt
```

Create `.env`:
```env
GROQ_API_KEY=your_groq_key
GEMINI_API_KEY=your_gemini_key
DATADOG_API_KEY=your_datadog_key
DATADOG_APP_KEY=your_datadog_app_key
DD_SITE=us5.datadoghq.com
DATABASE_URL=postgresql://postgres.xxxxx:password@aws-x.pooler.supabase.com:6543/postgres
```

```bash
python -m uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

### Flutter Mobile App

```bash
git clone https://github.com/Shreyas1534/auralysis
cd auralysis

# Update API URL in lib/api_service.dart
# Set baseUrl to your backend URL

flutter pub get
flutter run -d linux   # or your device
```

### Web App

```bash
cd web
npm install
npm run dev
```

---

## Database Schema

```
┌─────────────────────────────┐
│           users             │
├─────────────────────────────┤
│ id            INTEGER PK    │
│ name          VARCHAR       │
│ email         VARCHAR UNIQUE│
│ password_hash VARCHAR       │
│ age           VARCHAR       │
│ blood_group   VARCHAR       │
└──────────────┬──────────────┘
               │ 1:N
               ▼
┌─────────────────────────────┐
│        scan_history         │
├─────────────────────────────┤
│ id            INTEGER PK    │
│ user_id       INTEGER FK    │
│ disease       VARCHAR       │
│ confidence    FLOAT         │
│ date          VARCHAR       │
│ report_summary TEXT         │
│ voice_url     VARCHAR NULL  │
└─────────────────────────────┘

┌─────────────────────────────┐
│          doctors            │
├─────────────────────────────┤
│ id            INTEGER PK    │
│ name          VARCHAR       │
│ specialty     VARCHAR       │
│ hospital      VARCHAR       │
│ phone         VARCHAR       │
│ locality      VARCHAR       │
│ email         VARCHAR NULL  │
│ password_hash VARCHAR NULL  │
└─────────────────────────────┘
```

---

## Disease Classes

| Class | Type | Description |
|-------|------|-------------|
| `brain_glioma` | Brain | Malignant brain tumor |
| `brain_meningioma` | Brain | Meninges tumor |
| `brain_normal` | Brain | Normal brain scan |
| `brain_pituitary` | Brain | Pituitary tumor |
| `chest_normal` | Chest | Normal chest X-ray |
| `chest_pneumonia` | Chest | Pneumonia detected |

---

## Disclaimer

> Auralysis is an AI-assisted diagnostic tool for educational and informational purposes only. It is **not** a substitute for professional medical advice, diagnosis, or treatment. Always consult a qualified healthcare provider with any questions regarding a medical condition.

---

## Team

Built at hackathon — 24 hours.

| Role | Contribution |
|------|-------------|
| ML Engineering | EfficientNetV2B0 training, TensorFlow API |
| Backend | FastAPI orchestrator, auth, database |
| Mobile | Flutter app, UI/UX |
| Web | React frontend, i18n, chatbot |
| DevOps | Render deployment, Supabase, Datadog |
