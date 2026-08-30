import os
from pathlib import Path

# Base Paths
BACKEND_DIR = Path(__file__).resolve().parent.parent
BASE_DIR = BACKEND_DIR.parent
DATA_DIR = BACKEND_DIR / "data"
UPLOADS_DIR = DATA_DIR / "uploads"
VIDEOS_DIR = DATA_DIR / "videos"
SAMPLE_FRAMES_DIR = DATA_DIR / "sample_frames"
WEIGHTS_DIR = BACKEND_DIR / "weights"

# Ensure directories exist
DATA_DIR.mkdir(parents=True, exist_ok=True)
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
VIDEOS_DIR.mkdir(parents=True, exist_ok=True)
SAMPLE_FRAMES_DIR.mkdir(parents=True, exist_ok=True)
WEIGHTS_DIR.mkdir(parents=True, exist_ok=True)

# Database
DATABASE_URL = f"sqlite:///{DATA_DIR}/urban_intelligence.db"

# Transit & Map Coordinates (Default: Pune Bus Transit Corridor - Pune Station / Hinjewadi / Nagar Rd)
DEFAULT_CENTER_LAT = 18.5204
DEFAULT_CENTER_LNG = 73.8567

# Vehicle Density Thresholds
DENSITY_LOW_MAX = 5
DENSITY_MODERATE_MAX = 10
# 11+ is HIGH
