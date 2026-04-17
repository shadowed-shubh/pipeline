from sqlalchemy import create_engine, Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import declarative_base, sessionmaker, relationship

DATABASE_URL = "sqlite:///./auralysis.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    password_hash = Column(String)
    age = Column(String)
    blood_group = Column(String)
    history = relationship("ScanHistory", back_populates="user")

class ScanHistory(Base):
    __tablename__ = "scan_history"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    disease = Column(String)
    confidence = Column(Float)
    date = Column(String)
    # The JSON string or detailed report
    report_summary = Column(String)
    voice_url = Column(String, nullable=True)
    user = relationship("User", back_populates="history")

class Doctor(Base):
    __tablename__ = "doctors"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    specialty = Column(String)
    hospital = Column(String)
    phone = Column(String)
    locality = Column(String)

Base.metadata.create_all(bind=engine)

def seed_doctors():
    db = SessionLocal()
    if db.query(Doctor).count() == 0:
        doctors = [
            Doctor(name="Dr. Sarah Jenkins", specialty="Pulmonologist", hospital="City General Hospital", phone="+1 555-0100", locality="Downtown"),
            Doctor(name="Dr. Michael Chen", specialty="Neurologist", hospital="Mercy Medical Center", phone="+1 555-0101", locality="Westside"),
            Doctor(name="Dr. Emily Patel", specialty="Radiologist", hospital="Valley Health Clinic", phone="+1 555-0102", locality="North Hills"),
            Doctor(name="Dr. James Wilson", specialty="Oncologist", hospital="Hope Cancer Center", phone="+1 555-0103", locality="East End"),
        ]
        db.add_all(doctors)
        db.commit()
    db.close()

seed_doctors()
