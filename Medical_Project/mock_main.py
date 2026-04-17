from fastapi import FastAPI, UploadFile, File
import random

app = FastAPI(title="Medical Diagnosis API (Mock)")

class_names = [
    "brain_glioma",
    "brain_meningioma",
    "brain_normal",
    "brain_pituitary",
    "chest_normal",
    "chest_pneumonia"
]

@app.get("/")
def root():
    return {
        "status": "running",
        "message": "Medical Diagnosis API (MOCK) is live",
        "note": "This is a mock service for testing"
    }

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    prediction = random.choice(class_names)
    confidence = round(random.uniform(0.75, 0.99), 4)
    probabilities = {c: round(random.uniform(0.01, 0.99), 4) for c in class_names}
    
    return {
        "prediction": prediction,
        "confidence": confidence,
        "probabilities": probabilities
    }
