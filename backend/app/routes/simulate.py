from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Dict, Any, Optional
import base64
import uuid
import datetime

from ..database import get_db
from ..models import Alert, Bus, ActivityLog
from ..simulator import sim_state, step_simulation, initialize_fleet_and_demo_data, get_nearby_alert, FLEET_ROUTES
from ..detector import process_frame

router = APIRouter(prefix="/api/simulate", tags=["Simulator"])

class LiveFramePayload(BaseModel):
    bus_id: str = "BUS-104"
    image_base64: str
    progress: float = 0.0
    speed_kmh: float = 32.0
    lat: Optional[float] = None
    lng: Optional[float] = None
    location_name: Optional[str] = None


@router.get("/status")
def get_simulation_status():
    """Get current simulation state, active bus, waypoint, and playback status"""
    total_wp = len(sim_state.waypoints)
    curr_idx = sim_state.current_step % max(total_wp, 1)
    waypoint = sim_state.waypoints[curr_idx] if sim_state.waypoints else None
    
    return {
        "is_playing": sim_state.is_playing,
        "current_step": sim_state.current_step,
        "total_waypoints": total_wp,
        "active_bus_id": sim_state.active_bus_id,
        "active_bus_plate": sim_state.active_bus_plate,
        "active_route": sim_state.active_route_name,
        "current_waypoint": waypoint,
        "speed_multiplier": sim_state.speed_multiplier,
        "video_stream_url": getattr(sim_state, "video_stream_url", "/videos/bus_dashcam_feed.mp4")
    }


@router.post("/set-city")
def set_sim_city(city: str = Query(...)):
    """Switch active city and default bus"""
    sim_state.set_active_city(city)
    return {
        "status": "success",
        "active_city_id": sim_state.active_city_id,
        "active_bus_id": sim_state.active_bus_id,
        "active_bus_plate": sim_state.active_bus_plate,
        "active_route": sim_state.active_route_name,
        "video_stream_url": getattr(sim_state, "video_stream_url", "/videos/bus_dashcam_feed.mp4")
    }


@router.post("/set-bus")
def set_sim_bus(bus_id: str = Query(...)):
    """Switch active simulated bus and corresponding video stream"""
    sim_state.set_active_bus(bus_id)
    return {
        "status": "success",
        "active_city_id": sim_state.active_city_id,
        "active_bus_id": sim_state.active_bus_id,
        "active_bus_plate": sim_state.active_bus_plate,
        "active_route": sim_state.active_route_name,
        "video_stream_url": getattr(sim_state, "video_stream_url", "/videos/bus_dashcam_feed.mp4")
    }


@router.post("/set-camera")
def set_sim_camera(camera_id: str = Query(...)):
    """Switch active camera angle (CAM-1-FRONT, CAM-2-SIDE, CAM-3-REAR)"""
    sim_state.set_active_camera(camera_id)
    return {
        "status": "success",
        "active_camera_id": sim_state.active_camera_id
    }


@router.post("/step")
def trigger_step(
    db: Session = Depends(get_db),
    progress: Optional[float] = Query(None, description="Video progress 0.0-1.0 for timeline-synced waypoint selection"),
    lat: Optional[float] = Query(None, description="Exact interpolated GPS latitude from frontend"),
    lng: Optional[float] = Query(None, description="Exact interpolated GPS longitude from frontend")
):
    """Manually step simulation by 1 frame / waypoint, optionally synced to video timeline progress"""
    result = step_simulation(db, video_progress=progress, exact_lat=lat, exact_lng=lng)
    return result


@router.post("/live-frame")
def ingest_live_video_frame(payload: LiveFramePayload, db: Session = Depends(get_db)):
    """
    Ingests the exact live video frame from the active dashcam stream,
    runs YOLOv8 vehicle detection and road cavity defect analysis,
    and returns real-time detections with spatial deduplication.
    """
    try:
        # Decode base64 image data
        img_data = payload.image_base64
        if "," in img_data:
            img_data = img_data.split(",")[1]
        raw_bytes = base64.b64decode(img_data)
        
        bus_config = FLEET_ROUTES.get(payload.bus_id, FLEET_ROUTES["BUS-104"])
        waypoints = bus_config["waypoints"]
        wp_idx = int(payload.progress * (len(waypoints) - 1))
        wp = waypoints[min(wp_idx, len(waypoints) - 1)]
        
        gps_lat = payload.lat or wp["lat"]
        gps_lng = payload.lng or wp["lng"]
        loc_name = payload.location_name or wp["name"]
        
        res = process_frame(
            image_input=raw_bytes,
            bus_id=payload.bus_id,
            route_id=bus_config["route_id"],
            speed_kmh=payload.speed_kmh,
            gps_lat=gps_lat,
            gps_lng=gps_lng,
            location_name=loc_name
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Live frame inference failed: {str(e)}")

    created_alerts = []
    
    # 1. If defect detected, persist with spatial deduplication & sighting counter
    if res["has_pothole"]:
        existing_pothole = get_nearby_alert(db, "pothole", gps_lat, gps_lng)
        if existing_pothole:
            existing_pothole.sighting_count = (existing_pothole.sighting_count or 1) + 1
            existing_pothole.last_seen_at = datetime.datetime.utcnow()
            existing_pothole.timestamp = datetime.datetime.utcnow()
            existing_pothole.confidence = min(0.99, round(max(existing_pothole.confidence, res["confidence"]) + 0.01, 2))
            existing_pothole.speed_kmh = payload.speed_kmh
            
            # Update confirming buses list
            existing_buses = set([b.strip() for b in (existing_pothole.confirming_buses or existing_pothole.bus_id).split(",") if b.strip()])
            existing_buses.add(payload.bus_id)
            existing_pothole.confirming_buses = ", ".join(sorted(list(existing_buses)))
            
            if existing_pothole.sighting_count >= 2 and existing_pothole.status == "OPEN":
                existing_pothole.status = "VERIFIED"

            if res.get("annotated_image_url"):
                existing_pothole.annotated_image_url = res.get("annotated_image_url")
                existing_pothole.raw_image_url = res.get("raw_image_url")
        else:
            alert_code = f"PTH-{uuid.uuid4().hex[:6].upper()}"
            now = datetime.datetime.utcnow()
            pothole_alert = Alert(
                alert_code=alert_code,
                alert_type="pothole",
                severity=res["highest_severity"],
                confidence=res["confidence"],
                vehicle_count=res["total_vehicles"],
                density_level=res["density_level"],
                bus_id=payload.bus_id,
                route_id=bus_config["route_id"],
                latitude=gps_lat,
                longitude=gps_lng,
                location_name=loc_name,
                timestamp=now,
                first_detected_at=now,
                last_seen_at=now,
                sighting_count=1,
                confirming_buses=payload.bus_id,
                raw_image_url=res.get("raw_image_url"),
                annotated_image_url=res.get("annotated_image_url"),
                status="OPEN",
                defect_depth_est=res.get("defect_depth_est", "~5.6 cm (Opt. Depth Index)"),
                defect_area_est=res.get("defect_area_est", "0.40 sq.m"),
                speed_kmh=payload.speed_kmh,
                ai_agent_name=f"Road Defect Agent ({payload.bus_id})"
            )
            db.add(pothole_alert)
            created_alerts.append(alert_code)
            
            log = ActivityLog(
                bus_id=payload.bus_id,
                agent_name=f"Road Defect Agent ({payload.bus_id})",
                activity_type="DETECTION",
                message=f"Pothole detected live at {loc_name} (Conf: {int(res['confidence']*100)}%, Sev: {res['highest_severity']})",
                timestamp=now,
                severity="CRITICAL" if res["highest_severity"] == "CRITICAL" else "WARNING"
            )
            db.add(log)

    # 2. If traffic flow detected
    if res["total_vehicles"] >= 4 or res["density_level"] in ["HIGH", "MODERATE"] or payload.bus_id == "BUS-301":
        existing_traffic = get_nearby_alert(db, "vehicle_density", gps_lat, gps_lng)
        if existing_traffic:
            existing_traffic.vehicle_count = res["total_vehicles"]
            existing_traffic.density_level = res["density_level"]
            existing_traffic.timestamp = datetime.datetime.utcnow()
            existing_traffic.speed_kmh = payload.speed_kmh
        else:
            alert_code = f"TRF-{uuid.uuid4().hex[:6].upper()}"
            traffic_alert = Alert(
                alert_code=alert_code,
                alert_type="vehicle_density",
                severity="HIGH" if res["total_vehicles"] >= 8 else "MEDIUM",
                confidence=0.94,
                vehicle_count=max(res["total_vehicles"], 4 if payload.bus_id != "BUS-301" else 18),
                density_level="HIGH" if res["total_vehicles"] >= 8 or payload.bus_id == "BUS-301" else "MODERATE",
                bus_id=payload.bus_id,
                route_id=bus_config["route_id"],
                latitude=gps_lat,
                longitude=gps_lng,
                location_name=loc_name,
                timestamp=datetime.datetime.utcnow(),
                raw_image_url=res.get("raw_image_url"),
                annotated_image_url=res.get("annotated_image_url"),
                status="OPEN",
                speed_kmh=payload.speed_kmh,
                ai_agent_name=f"Traffic Intelligence Agent ({payload.bus_id})"
            )
            db.add(traffic_alert)
            created_alerts.append(alert_code)

    # Update Bus position in database
    bus = db.query(Bus).filter(Bus.bus_label == payload.bus_id).first()
    if bus:
        bus.current_lat = gps_lat
        bus.current_lng = gps_lng
        bus.speed_kmh = payload.speed_kmh
        bus.last_ping = datetime.datetime.utcnow()
        bus.total_detections += len(created_alerts)
        bus.total_potholes += (1 if res["has_pothole"] else 0)
        bus.total_vehicles += res["total_vehicles"]

    db.commit()

    return {
        "status": "success",
        "detection": res,
        "created_alerts": created_alerts,
        "gps_lat": gps_lat,
        "gps_lng": gps_lng
    }


@router.post("/toggle-play")
def toggle_playback(play: bool = Query(...)):
    """Start or pause continuous automatic simulation"""
    sim_state.is_playing = play
    return {"is_playing": sim_state.is_playing}


@router.post("/reset")
def reset_simulation_data(clean_slate: bool = Query(True), db: Session = Depends(get_db)):
    """Reset simulation back to start and reload the comprehensive demonstration dataset"""
    sim_state.bus_steps = {"BUS-104": 0, "BUS-218": 0, "BUS-301": 0, "HYD-101": 0, "HYD-204": 0, "HYD-305": 0}
    sim_state.is_playing = False

    from seed_demo_data import run_seed
    run_seed()

    return {
        "status": "success", 
        "message": "System reset to pristine demonstration state with comprehensive alerts, fleet, watchlist, and signboards across Hyderabad and Pune.",
        "clean_slate": clean_slate
    }
