from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from .config import UPLOADS_DIR, VIDEOS_DIR
from .database import engine, Base, SessionLocal
from .models import Alert, Bus, ActivityLog
from .simulator import initialize_fleet_and_demo_data
from .routes import ingest, alerts, stats, fleet, simulate

# Initialize SQLite tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="ROADWISE AI — Urban Transit Intelligence Platform",
    description="SIH26124: Mobile Edge-AI sensing on public transport bus fleets for road defect detection and traffic intelligence.",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Static Files for Evidence Images and Video Streams
app.mount("/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")
app.mount("/videos", StaticFiles(directory=str(VIDEOS_DIR)), name="videos")

# Include API Routers
app.include_router(ingest.router)
app.include_router(alerts.router)
app.include_router(stats.router)
app.include_router(fleet.router)
app.include_router(simulate.router)

@app.on_event("startup")
def startup_event():
    db = SessionLocal()
    try:
        initialize_fleet_and_demo_data(db)
        print("[ROADWISE AI] Database and initial fleet telemetry initialized.")
    finally:
        db.close()

@app.get("/")
def root():
    return {
        "platform": "ROADWISE AI Urban Intelligence",
        "problem_statement": "SIH26124",
        "status": "ONLINE",
        "docs": "/docs"
    }
