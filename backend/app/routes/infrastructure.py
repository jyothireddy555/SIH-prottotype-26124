from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
import datetime

from ..database import get_db
from ..models import Watchlist, WatchlistMatch, Signboard, ActivityLog

router = APIRouter(prefix="/api/infrastructure", tags=["Infrastructure & Watchlist"])

class WatchlistCreate(BaseModel):
    plate_number: str
    formatted_plate: Optional[str] = None
    vehicle_description: str
    reason: str
    threat_level: Optional[str] = "P0_CRITICAL"

@router.get("/watchlist")
def get_watchlist(active_only: bool = True, db: Session = Depends(get_db)):
    """Retrieve centrally maintained vehicle plate watchlist"""
    q = db.query(Watchlist)
    if active_only:
        q = q.filter(Watchlist.active == True)
    return q.order_by(Watchlist.created_at.desc()).all()

@router.post("/watchlist")
def add_watchlist_entry(entry: WatchlistCreate, db: Session = Depends(get_db)):
    """Register a new vehicle plate to the authoritative watchlist (synced to all bus edge nodes)"""
    norm_plate = entry.plate_number.replace("-", "").replace(" ", "").upper()
    existing = db.query(Watchlist).filter(Watchlist.plate_number == norm_plate).first()
    if existing:
        existing.active = True
        existing.reason = entry.reason
        existing.vehicle_description = entry.vehicle_description
        existing.threat_level = entry.threat_level
        db.commit()
        return {"status": "updated", "plate": norm_plate}
    
    new_w = Watchlist(
        plate_number=norm_plate,
        formatted_plate=entry.formatted_plate or entry.plate_number.upper(),
        vehicle_description=entry.vehicle_description,
        reason=entry.reason,
        threat_level=entry.threat_level,
        active=True,
        created_at=datetime.datetime.utcnow()
    )
    db.add(new_w)
    
    # Broadcast log
    db.add(ActivityLog(
        bus_id="ALL_BUSES",
        agent_name="Central Watchlist Authority",
        activity_type="SYSTEM",
        message=f"🚨 New Watchlist Target Registered: {new_w.formatted_plate} ({new_w.reason}). Synced to all fleet edge nodes.",
        timestamp=datetime.datetime.utcnow(),
        severity="WARNING"
    ))
    db.commit()
    return {"status": "created", "plate": norm_plate}

@router.delete("/watchlist/{plate}")
def remove_watchlist_entry(plate: str, db: Session = Depends(get_db)):
    """Deactivate vehicle from watchlist"""
    norm_plate = plate.replace("-", "").replace(" ", "").upper()
    entry = db.query(Watchlist).filter(Watchlist.plate_number == norm_plate).first()
    if entry:
        entry.active = False
        db.commit()
    return {"status": "deactivated", "plate": norm_plate}

@router.get("/watchlist/matches")
def get_watchlist_matches(city: Optional[str] = None, db: Session = Depends(get_db)):
    """Retrieve verified ANPR watchlist alerts sent from mobile edge cameras"""
    q = db.query(WatchlistMatch)
    if city:
        q = q.filter(WatchlistMatch.city_id == city.lower())
    return q.order_by(WatchlistMatch.timestamp.desc()).limit(50).all()

@router.get("/signboards")
def get_signboards(city: Optional[str] = Query("hyderabad"), db: Session = Depends(get_db)):
    """Retrieve historical signboard inventory baseline and current missing/present status"""
    city_filter = city.lower() if city else "hyderabad"
    return db.query(Signboard).filter(Signboard.city_id == city_filter).all()
