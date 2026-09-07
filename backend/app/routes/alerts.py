from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from ..database import get_db
from ..models import Alert, ActivityLog
from ..schemas import AlertOut

router = APIRouter(prefix="/api/alerts", tags=["Alerts"])

@router.get("", response_model=List[AlertOut])
def get_alerts(
    city: Optional[str] = None,
    category: Optional[str] = None,
    alert_type: Optional[str] = None,
    severity: Optional[str] = None,
    bus_id: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """List recent alerts with optional multi-city and category filters"""
    query = db.query(Alert)
    
    if city and isinstance(city, str):
        query = query.filter(Alert.city_id == city.lower())
    if alert_type and isinstance(alert_type, str):
        query = query.filter(Alert.alert_type == alert_type)
    if category and isinstance(category, str):
        # Category grouping
        cat = category.lower()
        if cat == "road":
            query = query.filter(Alert.alert_type.in_([
                "pothole", "water_logging", "road_crack", "road_damage", 
                "garbage", "missing_divider", "zebra_fading"
            ]))
        elif cat == "traffic":
            query = query.filter(Alert.alert_type.in_(["vehicle_density", "congestion"]))
        elif cat == "safety":
            query = query.filter(Alert.alert_type.in_([
                "overloaded_two_wheeler", "helmet_violation", "rash_driving", "accident"
            ]))
        elif cat == "security" or cat == "watchlist":
            query = query.filter(Alert.alert_type == "watchlist_match")
    if severity and isinstance(severity, str):
        query = query.filter(Alert.severity == severity)
    if bus_id and isinstance(bus_id, str):
        query = query.filter(Alert.bus_id == bus_id)
    if status and isinstance(status, str):
        query = query.filter(Alert.status == status)

    return query.order_by(Alert.timestamp.desc()).limit(limit).all()


@router.get("/{alert_id}", response_model=AlertOut)
def get_alert_detail(alert_id: int, db: Session = Depends(get_db)):
    """Retrieve single alert artifact and evidence"""
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    return alert


@router.patch("/{alert_id}/action")
def update_alert_action(
    alert_id: int,
    action: str = Query(..., pattern="^(verify|dispatch|resolve)$"),
    db: Session = Depends(get_db)
):
    """Update incident status (Verify defect / Dispatch road crew / Mark resolved)"""
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    new_status = "OPEN"
    if action == "verify":
        new_status = "VERIFIED"
        msg = f"Incident #{alert.alert_code} ({alert.alert_type.upper()}) marked as VERIFIED by Municipal Engineer."
        sev = "INFO"
    elif action == "dispatch":
        new_status = "DISPATCHED"
        msg = f"Road Maintenance Crew dispatched for #{alert.alert_code} at {alert.location_name}."
        sev = "SUCCESS"
    elif action == "resolve":
        new_status = "RESOLVED"
        msg = f"Road repair completed for #{alert.alert_code}. Hazard cleared."
        sev = "SUCCESS"

    alert.status = new_status
    
    # Log Action
    log = ActivityLog(
        bus_id=alert.bus_id,
        agent_name="Incident Dispatch Agent",
        activity_type="DISPATCH",
        message=msg,
        timestamp=datetime.utcnow(),
        severity=sev
    )
    db.add(log)
    db.commit()

    return {"status": "success", "alert_code": alert.alert_code, "new_status": new_status}
