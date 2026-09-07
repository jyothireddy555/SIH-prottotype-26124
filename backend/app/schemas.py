from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class AlertBase(BaseModel):
    alert_type: str
    city_id: Optional[str] = "hyderabad"
    severity: str
    priority_level: Optional[str] = "P2"
    confidence: float
    vehicle_count: Optional[int] = 0
    density_level: Optional[str] = "LOW"
    bus_id: str
    route_id: str
    camera_id: Optional[str] = "CAM-1-FRONT"
    latitude: float
    longitude: float
    location_name: Optional[str] = "Urban Transit Corridor"
    status: Optional[str] = "OPEN"
    defect_depth_est: Optional[str] = "~5.0 cm"
    defect_area_est: Optional[str] = "0.35 sq.m"
    speed_kmh: Optional[float] = 32.0
    ai_agent_name: Optional[str] = "Road Defect Agent"
    sighting_count: Optional[int] = 1
    first_detected_at: Optional[datetime] = None
    last_seen_at: Optional[datetime] = None
    confirming_buses: Optional[str] = "HYD-101"
    metadata_json: Optional[str] = None

class AlertCreate(AlertBase):
    raw_image_url: Optional[str] = None
    annotated_image_url: Optional[str] = None

class AlertOut(AlertBase):
    id: int
    alert_code: str
    timestamp: datetime
    raw_image_url: Optional[str] = None
    annotated_image_url: Optional[str] = None
    sighting_count: Optional[int] = 1
    first_detected_at: Optional[datetime] = None
    last_seen_at: Optional[datetime] = None
    confirming_buses: Optional[str] = "HYD-101"

    class Config:
        from_attributes = True

class BusOut(BaseModel):
    id: int
    city_id: Optional[str] = "hyderabad"
    bus_number: str
    bus_label: str
    route_id: str
    route_name: str
    current_lat: float
    current_lng: float
    speed_kmh: float
    heading: float
    camera_status: str
    active_camera: Optional[str] = "CAM-1-FRONT"
    last_ping: datetime
    total_detections: int
    total_potholes: int
    total_vehicles: int

    class Config:
        from_attributes = True

class ActivityLogOut(BaseModel):
    id: int
    bus_id: Optional[str] = None
    agent_name: str
    activity_type: str
    message: str
    timestamp: datetime
    severity: str

    class Config:
        from_attributes = True

class StatsOut(BaseModel):
    total_alerts: int
    total_potholes: int
    total_traffic_alerts: int
    high_severity_count: int
    critical_severity_count: int
    open_incidents: int
    verified_incidents: int
    dispatched_incidents: int
    active_buses: int
    avg_confidence: float
    road_health_index: float
    severity_breakdown: Dict[str, int]
    defect_type_breakdown: Dict[str, int]
    top_corridors: List[Dict[str, Any]]
