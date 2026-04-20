# 🧠 Auralysis ML Inference API
### TensorFlow Medical Image Classification Service

> Standalone ML prediction API. Accepts MRI and X-ray images, returns disease classification with confidence scores.

[![TensorFlow](https://img.shields.io/badge/TensorFlow-2.15-FF6F00?style=flat-square&logo=tensorflow)](https://tensorflow.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-Latest-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com)
[![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=flat-square&logo=python)](https://python.org)
[![Render](https://img.shields.io/badge/Deployed-Render-46E3B7?style=flat-square)](https://render.com)

---

## What This Service Does

- Loads a trained **EfficientNetV2B0** TensorFlow SavedModel
- Accepts MRI or X-ray images via REST API
- Preprocesses and runs inference
- Returns predicted disease class + confidence score + full probability distribution

This API is consumed exclusively by the Auralysis orchestrator backend.

---

## Model Details

| Property | Value |
|----------|-------|
| Architecture | EfficientNetV2B0 |
| Framework | TensorFlow 2.15 / Keras |
| Format | TensorFlow SavedModel |
| Input | 224×224 RGB image |
| Output | 6-class softmax probabilities |

### Disease Classes

| Index | Class | Description |
|-------|-------|-------------|
| 0 | `brain_glioma` | Malignant brain tumor |
| 1 | `brain_meningioma` | Tumor of the meninges |
| 2 | `brain_normal` | Normal brain MRI |
| 3 | `brain_pituitary` | Pituitary gland tumor |
| 4 | `chest_normal` | Normal chest X-ray |
| 5 | `chest_pneumonia` | Pneumonia in chest X-ray |

---

## API Reference

### `GET /`
Health check.
```json
{
  "status": "running",
  "message": "Medical Diagnosis API is live",
  "endpoints": {
    "predict": "POST /predict (multipart/form-data, key=file)"
  }
}
```

### `POST /predict`
Run inference on an uploaded image.

**Request:**
```bash
curl -X POST https://your-ml-api.onrender.com/predict \
  -F "file=@/path/to/xray.jpg"
```

**Response:**
```json
{
  "prediction": "chest_pneumonia",
  "confidence": 0.7311,
  "probabilities": {
    "brain_glioma": 0.0021,
    "brain_meningioma": 0.0018,
    "brain_normal": 0.0009,
    "brain_pituitary": 0.0012,
    "chest_normal": 0.2629,
    "chest_pneumonia": 0.7311
  }
}
```

---

## Local Setup

```bash
# Python 3.11 required — use Miniconda
conda create -n ml-api python=3.11 -y
conda activate ml-api

git clone https://github.com/Shreyas1534/Medical_Project
cd Medical_Project

pip install tensorflow==2.15.0
pip install fastapi uvicorn pydantic python-multipart Pillow

python -m uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

Test:
```bash
curl http://localhost:8001/
curl -X POST http://localhost:8001/predict -F "file=@test_image.jpg"
```

---

## File Structure

```
Medical_Project/
├── main.py           # FastAPI app + inference logic
├── saved_model/      # TensorFlow SavedModel directory
│   ├── saved_model.pb
│   └── variables/
├── requirements.txt
└── render.yaml       # Render deployment config
```

---

## Deployment

Deployed on **Render** free tier.

`render.yaml`:
```yaml
services:
  - type: web
    name: medical-project-api
    env: python
    buildCommand: pip install -r requirements.txt
    startCommand: uvicorn main:app --host 0.0.0.0 --port $PORT
```

> First request after inactivity takes 30-60s (cold start). The orchestrator handles this with a timeout.

---

## Notes

- Python 3.11 required — TensorFlow 2.15 does not support Python 3.13+
- Model is loaded once at startup and cached in memory
- Image is resized to 224×224 before inference
- Confidence threshold is not applied — orchestrator decides what to do with low-confidence results
