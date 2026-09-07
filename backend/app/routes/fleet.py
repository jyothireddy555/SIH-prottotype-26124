from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from ..database import get_db
from ..models import Bus, ActivityLog
from ..schemas import BusOut, ActivityLogOut

router = APIRouter(prefix="/api/fleet", tags=["Fleet"])

@router.get("/buses", response_model=List[BusOut])
def get_fleet_buses(city: Optional[str] = Query(None), db: Session = Depends(get_db)):
    """Retrieve active transit buses, coordinates, telemetry, and camera status for a city"""
    query = db.query(Bus)
    if city:
        query = query.filter(Bus.city_id == city.lower())
    return query.all()


@router.get("/activity", response_model=List[ActivityLogOut])
def get_activity_logs(city: Optional[str] = Query(None), limit: int = 30, db: Session = Depends(get_db)):
    """Live streaming AI activity feed for a city"""
    query = db.query(ActivityLog)
    if city:
        query = query.filter(ActivityLog.city_id == city.lower())
    return query.order_by(ActivityLog.timestamp.desc()).limit(limit).all()

