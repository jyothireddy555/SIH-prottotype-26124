from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from .config import UPLOADS_DIR, VIDEOS_DIR
from .database import engine, Base, SessionLocal
from .models import Alert, Bus, ActivityLog
from .simulator import initialize_fleet_and_demo_data
from .routes import ingest, alerts, stats, fleet, simulate, infrastructure

# Initialize SQLite tables
Base.metadata.create_all(bind=engine)

# BUG-013 FIX: Migrated from deprecated @app.on_event("startup") to modern lifespan context manager.
# Required for FastAPI >= 0.93 — the old decorator emits a DeprecationWarning.
@asynccontextmanager
async def lifespan(app: FastAPI):
    db = SessionLocal()
    try:
        initialize_fleet_and_demo_data(db)
        print("[ROADWISE AI] Database and initial fleet telemetry initialized.")
    finally:
        db.close()
    yield  # App is live and serving requests during this point

app = FastAPI(
    title="ROADWISE AI — Urban Transit Intelligence Platform",
    description="SIH26124: Mobile Edge-AI sensing on public transport bus fleets for road defect detection and traffic intelligence.",
    version="1.0.0",
    lifespan=lifespan
)

# BUG-008 FIX: allow_origins=["*"] + allow_credentials=True violates CORS spec and is rejected
# by Chrome/Firefox. Listing explicit dev/preview origins fixes the spec violation.
_ALLOWED_ORIGINS = [
    "http://localhost:5173",   # Vite dev server
    "http://localhost:4173",   # Vite preview
    "http://127.0.0.1:5173",
    "http://127.0.0.1:4173",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_ALLOWED_ORIGINS,
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
app.include_router(infrastructure.router)

@app.get("/")
def root():
    return {
        "platform": "ROADWISE AI Urban Intelligence",
        "problem_statement": "SIH26124",
        "status": "ONLINE",
        "docs": "/docs"
    }
