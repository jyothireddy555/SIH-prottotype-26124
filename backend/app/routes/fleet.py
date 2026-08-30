from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models import Bus, ActivityLog
from ..schemas import BusOut, ActivityLogOut

router = APIRouter(prefix="/api/fleet", tags=["Fleet"])

@router.get("/buses", response_model=List[BusOut])
def get_fleet_buses(db: Session = Depends(get_db)):
    """Retrieve active transit buses, coordinates, telemetry, and camera status"""
    return db.query(Bus).all()


@router.get("/activity", response_model=List[ActivityLogOut])
def get_activity_logs(limit: int = 30, db: Session = Depends(get_db)):
    """Live streaming AI activity feed"""
    return db.query(ActivityLog).order_by(ActivityLog.timestamp.desc()).limit(limit).all()
