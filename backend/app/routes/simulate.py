from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Dict, Any

from ..database import get_db
from ..models import Alert, Bus, ActivityLog
from ..simulator import sim_state, step_simulation, initialize_fleet_and_demo_data

router = APIRouter(prefix="/api/simulate", tags=["Simulator"])

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


@router.post("/set-bus")
def set_sim_bus(bus_id: str = Query(...)):
    """Switch active simulated bus and corresponding video stream"""
    sim_state.set_active_bus(bus_id)
    return {
        "status": "success",
        "active_bus_id": sim_state.active_bus_id,
        "active_bus_plate": sim_state.active_bus_plate,
        "active_route": sim_state.active_route_name,
        "video_stream_url": getattr(sim_state, "video_stream_url", "/videos/bus_dashcam_feed.mp4")
    }


@router.post("/step")
def trigger_step(db: Session = Depends(get_db)):
    """Manually step simulation by 1 frame / waypoint"""
    result = step_simulation(db)
    return result


@router.post("/toggle-play")
def toggle_playback(play: bool = Query(...)):
    """Start or pause continuous automatic simulation"""
    sim_state.is_playing = play
    return {"is_playing": sim_state.is_playing}


@router.post("/reset")
def reset_simulation_data(db: Session = Depends(get_db)):
    """Reset simulation back to start and re-seed clean baseline"""
    sim_state.current_step = 0
    sim_state.is_playing = False

    # Clear transient alerts
    db.query(Alert).delete()
    db.query(ActivityLog).delete()
    db.query(Bus).delete()
    db.commit()

    initialize_fleet_and_demo_data(db)

    return {"status": "success", "message": "Simulation and database reset to baseline."}
