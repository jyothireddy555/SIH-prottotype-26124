from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
import datetime
import random

from ..database import get_db
from ..models import Alert, ActivityLog, Bus
from ..detector import process_frame

router = APIRouter(prefix="/api", tags=["Ingest"])

@router.post("/ingest")
async def ingest_frame(
    file: UploadFile = File(...),
    bus_id: str = Form("BUS-104"),
    route_id: str = Form("Route 115"),
    speed_kmh: float = Form(32.0),
    latitude: float = Form(18.5204),
    longitude: float = Form(73.8567),
    location_name: str = Form("Transit Corridor"),
    db: Session = Depends(get_db)
):
    """
    Edge Ingestion Endpoint: Accepts road camera frame + bus telemetry.
    Runs YOLOv8 & Pothole models, annotates image, and logs alert if defects or traffic detected.
    """
    try:
        contents = await file.read()
        res = process_frame(
            image_input=contents,
            bus_id=bus_id,
            route_id=route_id,
            speed_kmh=speed_kmh,
            gps_lat=latitude,
            gps_lng=longitude,
            location_name=location_name
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Image processing failed: {str(e)}")

    created_alerts = []

    # If pothole detected, persist alert
    if res["has_pothole"]:
        code_num = random.randint(10000, 99999)
        pothole_alert = Alert(
            alert_code=f"PTH-{code_num}",
            alert_type="pothole",
            severity=res["highest_severity"],
            confidence=res["confidence"],
            vehicle_count=res["total_vehicles"],
            density_level=res["density_level"],
            bus_id=bus_id,
            route_id=route_id,
            latitude=latitude,
            longitude=longitude,
            location_name=location_name,
            timestamp=datetime.datetime.utcnow(),
            raw_image_url=res["raw_image_url"],
            annotated_image_url=res["annotated_image_url"],
            status="OPEN",
            defect_depth_est=f"~{random.uniform(4.5, 8.5):.1f} cm",
            defect_area_est=f"{random.uniform(0.28, 0.65):.2f} sq.m",
            speed_kmh=speed_kmh,
            ai_agent_name="Road Defect Agent"
        )
        db.add(pothole_alert)
        created_alerts.append(pothole_alert.alert_code)

        # Log Activity
        log = ActivityLog(
            bus_id=bus_id,
            agent_name="Road Defect Agent",
            activity_type="DETECTION",
            message=f"Pothole detected at {location_name} (Conf: {int(res['confidence']*100)}%, Sev: {res['highest_severity']})",
            timestamp=datetime.datetime.utcnow(),
            severity="CRITICAL" if res["highest_severity"] == "CRITICAL" else "WARNING"
        )
        db.add(log)

    # If high vehicle density, persist alert
    if res["density_level"] == "HIGH":
        code_num = random.randint(10000, 99999)
        traffic_alert = Alert(
            alert_code=f"TRF-{code_num}",
            alert_type="vehicle_density",
            severity="MEDIUM",
            confidence=0.91,
            vehicle_count=res["total_vehicles"],
            density_level="HIGH",
            bus_id=bus_id,
            route_id=route_id,
            latitude=latitude,
            longitude=longitude,
            location_name=location_name,
            timestamp=datetime.datetime.utcnow(),
            raw_image_url=res["raw_image_url"],
            annotated_image_url=res["annotated_image_url"],
            status="OPEN",
            speed_kmh=speed_kmh,
            ai_agent_name="Vehicle Counting Agent"
        )
        db.add(traffic_alert)
        created_alerts.append(traffic_alert.alert_code)

        log = ActivityLog(
            bus_id=bus_id,
            agent_name="Vehicle Counting Agent",
            activity_type="DETECTION",
            message=f"High vehicle density ({res['total_vehicles']} vehicles) at {location_name}",
            timestamp=datetime.datetime.utcnow(),
            severity="INFO"
        )
        db.add(log)

    # Update bus info
    bus = db.query(Bus).filter(Bus.bus_label == bus_id).first()
    if bus:
        bus.current_lat = latitude
        bus.current_lng = longitude
        bus.speed_kmh = speed_kmh
        bus.last_ping = datetime.datetime.utcnow()
        bus.total_detections += len(created_alerts)
        bus.total_potholes += (1 if res["has_pothole"] else 0)
        bus.total_vehicles += res["total_vehicles"]

    db.commit()

    return {
        "status": "success",
        "detection": res,
        "created_alerts": created_alerts
    }
