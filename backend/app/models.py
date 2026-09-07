from sqlalchemy import Column, Integer, String, Float, DateTime, Text, Boolean
from datetime import datetime
from .database import Base

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    alert_code = Column(String(50), unique=True, index=True)
    city_id = Column(String(50), default="hyderabad", index=True) # 'hyderabad', 'pune'
    alert_type = Column(String(50), index=True) 
    # Types: 'pothole', 'water_logging', 'road_crack', 'road_damage', 'garbage', 
    # 'missing_divider', 'zebra_fading', 'vehicle_density', 'congestion',
    # 'overloaded_two_wheeler', 'helmet_violation', 'rash_driving', 'accident', 'watchlist_match'
    severity = Column(String(20), default="MEDIUM") # 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
    priority_level = Column(String(10), default="P2") # 'P0' (Urgent), 'P1' (High), 'P2' (Normal), 'P3' (Info)
    confidence = Column(Float, default=0.90)
    vehicle_count = Column(Integer, default=0)
    density_level = Column(String(20), default="LOW") # 'LOW', 'MODERATE', 'HIGH'
    bus_id = Column(String(50), index=True) # e.g. 'HYD-101', 'BUS-104'
    route_id = Column(String(50), index=True) # e.g. 'Route 216', 'Route 115'
    camera_id = Column(String(50), default="CAM-1-FRONT") # 'CAM-1-FRONT', 'CAM-2-SIDE', 'CAM-3-REAR'
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    location_name = Column(String(255), default="Urban Transit Corridor")
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    raw_image_url = Column(String(500), nullable=True)
    annotated_image_url = Column(String(500), nullable=True)
    status = Column(String(30), default="OPEN") # 'OPEN', 'VERIFIED', 'DISPATCHED', 'RESOLVED'
    defect_depth_est = Column(String(50), default="~5.0 cm")
    defect_area_est = Column(String(50), default="0.35 sq.m")
    speed_kmh = Column(Float, default=32.0)
    ai_agent_name = Column(String(100), default="Road Defect Agent")
    sighting_count = Column(Integer, default=1)
    first_detected_at = Column(DateTime, default=datetime.utcnow)
    last_seen_at = Column(DateTime, default=datetime.utcnow)
    confirming_buses = Column(String(255), default="HYD-101")
    metadata_json = Column(Text, nullable=True) # Additional structured details (e.g. OCR plate, helmet counts)


class Bus(Base):
    __tablename__ = "buses"

    id = Column(Integer, primary_key=True, index=True)
    city_id = Column(String(50), default="hyderabad", index=True) # 'hyderabad', 'pune'
    bus_number = Column(String(50), unique=True, index=True)
    bus_label = Column(String(50), index=True)
    route_id = Column(String(50))
    route_name = Column(String(255))
    current_lat = Column(Float)
    current_lng = Column(Float)
    speed_kmh = Column(Float, default=28.0)
    heading = Column(Float, default=90.0)
    camera_status = Column(String(30), default="ONLINE") # 'ONLINE', 'STANDBY', 'OFFLINE'
    active_camera = Column(String(30), default="CAM-1-FRONT")
    last_ping = Column(DateTime, default=datetime.utcnow)
    total_detections = Column(Integer, default=0)
    total_potholes = Column(Integer, default=0)
    total_vehicles = Column(Integer, default=0)


class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id = Column(Integer, primary_key=True, index=True)
    city_id = Column(String(50), default="hyderabad", index=True)
    bus_id = Column(String(50), nullable=True)
    agent_name = Column(String(100), default="City AI Supervisor")
    activity_type = Column(String(50), default="DETECTION")
    message = Column(String(500))
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    severity = Column(String(20), default="INFO") # 'INFO', 'WARNING', 'CRITICAL', 'SUCCESS'


class Signboard(Base):
    __tablename__ = "signboards"

    id = Column(Integer, primary_key=True, index=True)
    signboard_code = Column(String(50), unique=True, index=True) # e.g. 'SB-HYD-014'
    city_id = Column(String(50), default="hyderabad", index=True)
    route_id = Column(String(50), index=True)
    segment_id = Column(String(50), nullable=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    location_name = Column(String(255))
    sign_type = Column(String(100)) # 'SPEED_LIMIT_50', 'STOP', 'PEDESTRIAN_CROSSING', 'U_TURN_PROHIBITED'
    ocr_text = Column(String(255), nullable=True)
    reference_image_url = Column(String(500), nullable=True)
    first_seen = Column(DateTime, default=datetime.utcnow)
    last_confirmed_present = Column(DateTime, default=datetime.utcnow)
    missed_observations = Column(Integer, default=0)
    status = Column(String(30), default="PRESENT") # 'PRESENT', 'POSSIBLY_MISSING', 'MISSING'


class Watchlist(Base):
    __tablename__ = "watchlist"

    id = Column(Integer, primary_key=True, index=True)
    plate_number = Column(String(50), unique=True, index=True) # Normalized plate text (e.g. 'TS09EA4412')
    formatted_plate = Column(String(50)) # 'TS-09-EA-4412'
    vehicle_description = Column(String(255))
    reason = Column(String(255)) # 'STOLEN_VEHICLE', 'POLICE_WARRANT', 'UNPAID_ECHALLAN_OVERDUE'
    threat_level = Column(String(20), default="P0_CRITICAL") # 'P0_CRITICAL', 'P1_HIGH'
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    match_count = Column(Integer, default=0)


class WatchlistMatch(Base):
    __tablename__ = "watchlist_matches"

    id = Column(Integer, primary_key=True, index=True)
    match_code = Column(String(50), unique=True, index=True)
    plate_number = Column(String(50), index=True)
    city_id = Column(String(50), default="hyderabad")
    bus_id = Column(String(50))
    camera_id = Column(String(50), default="CAM-1-FRONT")
    latitude = Column(Float)
    longitude = Column(Float)
    location_name = Column(String(255))
    timestamp = Column(DateTime, default=datetime.utcnow)
    confidence = Column(Float, default=0.96)
    evidence_image_url = Column(String(500), nullable=True)
    alert_status = Column(String(30), default="UNACKNOWLEDGED") # 'UNACKNOWLEDGED', 'POLICE_DISPATCHED', 'RESOLVED'

