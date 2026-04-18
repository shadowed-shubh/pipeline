from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

from database import SessionLocal, User, ScanHistory, Doctor
from auth import get_password_hash, verify_password, create_access_token, decode_access_token, timedelta, ACCESS_TOKEN_EXPIRE_MINUTES
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

router = APIRouter()
security = HTTPBearer()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db = Depends(get_db)):
    token = credentials.credentials
    payload = decode_access_token(token)
    if payload is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    email = payload.get("sub")
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user

# ── Pydantic Models ────────────────────────────────────────────

class UserRegister(BaseModel):
    name: str
    email: str
    password: str
    age: str
    blood_group: str

class UserLogin(BaseModel):
    email: str
    password: str

class ScanLogRequest(BaseModel):
    disease: str
    confidence: float
    report_summary: str
    voice_url: Optional[str] = None

class DoctorRegister(BaseModel):
    name:      str
    email:     str
    password:  str
    specialty: str
    hospital:  str
    phone:     str
    locality:  str

class ChatRequest(BaseModel):
    message: str
    context: Optional[str] = None

# ── Existing Endpoints (unchanged) ────────────────────────────

@router.post("/register")
def register(user: UserRegister, db = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = get_password_hash(user.password)
    new_user = User(
        name=user.name, 
        email=user.email, 
        password_hash=hashed_password,
        age=user.age,
        blood_group=user.blood_group
    )
    db.add(new_user)
    db.commit()
    return {"message": "User registered successfully"}

# ── CHANGE 3: Updated /login — returns role + full user object ──

@router.post("/login")
def login(user: UserLogin, db=Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if not db_user or not verify_password(user.password, db_user.password_hash):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    token = create_access_token(
        data={"sub": db_user.email, "role": "patient"},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return {
        "access_token": token,
        "token_type": "bearer",
        "role": "patient",
        "user": {
            "name": db_user.name,
            "email": db_user.email,
            "age": db_user.age,
            "blood_group": db_user.blood_group
        }
    }

# ── CHANGE 4: New endpoints ────────────────────────────────────

@router.post("/register-doctor")
def register_doctor(doctor: DoctorRegister, db=Depends(get_db)):
    existing = db.query(Doctor).filter(Doctor.email == doctor.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    new_doctor = Doctor(
        name=doctor.name,
        email=doctor.email,
        password_hash=get_password_hash(doctor.password),
        specialty=doctor.specialty,
        hospital=doctor.hospital,
        phone=doctor.phone,
        locality=doctor.locality
    )
    db.add(new_doctor)
    db.commit()
    return {"message": "Doctor registered successfully"}


@router.post("/login-doctor")
def login_doctor(user: UserLogin, db=Depends(get_db)):
    doctor = db.query(Doctor).filter(Doctor.email == user.email).first()
    if not doctor or not doctor.password_hash:
        raise HTTPException(status_code=401, detail="Doctor not found")
    if not verify_password(user.password, doctor.password_hash):
        raise HTTPException(status_code=401, detail="Incorrect password")
    token = create_access_token(
        data={"sub": doctor.email, "role": "doctor"},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return {
        "access_token": token,
        "token_type": "bearer",
        "role": "doctor",
        "user": {
            "name": doctor.name,
            "email": doctor.email,
            "specialty": doctor.specialty,
            "hospital": doctor.hospital
        }
    }


@router.post("/chat")
def chat(body: ChatRequest):
    from groq import Groq
    import os
    groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))
    messages = [
        {
            "role": "system",
            "content": (
                "You are Auralysis AI assistant. Help patients understand "
                "their medical reports in simple, empathetic language. "
                "Always clarify you are not a doctor and results need "
                "professional confirmation. Be concise — max 3 sentences."
            )
        },
        {
            "role": "user",
            "content": body.message + (
                f"\nReport context: {body.context}" if body.context else ""
            )
        }
    ]
    res = groq_client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=messages,
        temperature=0.7,
        max_tokens=300
    )
    return {"response": res.choices[0].message.content}

# ── CHANGE 5: Doctor all-reports endpoint ──────────────────────

@router.get("/doctor/all-reports")
def get_all_reports(
    db=Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    history = db.query(ScanHistory).all()
    return [
        {
            "id": h.id,
            "user_id": h.user_id,
            "disease": h.disease,
            "confidence": h.confidence,
            "date": h.date,
            "report_summary": h.report_summary
        }
        for h in history
    ]

# ── Existing history + doctors endpoints (unchanged) ──────────

@router.post("/history")
def add_history(scan: ScanLogRequest, db = Depends(get_db), current_user: User = Depends(get_current_user)):
    new_history = ScanHistory(
        user_id=current_user.id,
        disease=scan.disease,
        confidence=scan.confidence,
        date=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        report_summary=scan.report_summary,
        voice_url=scan.voice_url
    )
    db.add(new_history)
    db.commit()
    return {"message": "History added successfully"}

@router.get("/history")
def get_history(db = Depends(get_db), current_user: User = Depends(get_current_user)):
    history = db.query(ScanHistory).filter(ScanHistory.user_id == current_user.id).all()
    return [{"id": h.id, "disease": h.disease, "confidence": h.confidence, "date": h.date, "report_summary": h.report_summary, "voice_url": h.voice_url} for h in history]

@router.get("/doctors")
def get_doctors(specialty: Optional[str] = None, db = Depends(get_db)):
    query = db.query(Doctor)
    if specialty:
        query = query.filter(Doctor.specialty.ilike(f"%{specialty}%"))
    doctors = query.all()
    return [{"id": d.id, "name": d.name, "specialty": d.specialty, "hospital": d.hospital, "phone": d.phone, "locality": d.locality} for d in doctors]
