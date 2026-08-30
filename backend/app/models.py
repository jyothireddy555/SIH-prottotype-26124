from sqlalchemy import Column, Integer, String, Float, DateTime, Text, Boolean
from datetime import datetime
from .database import Base

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    alert_code = Column(String(50), unique=True, index=True)
    alert_type = Column(String(50), index=True) # 'pothole', 'vehicle_density', 'road_hazard'
    severity = Column(String(20), default="MEDIUM") # 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
    confidence = Column(Float, default=0.90)
    vehicle_count = Column(Integer, default=0)
    density_level = Column(String(20), default="LOW") # 'LOW', 'MODERATE', 'HIGH'
    bus_id = Column(String(50), index=True) # e.g. 'BUS-104'
    route_id = Column(String(50), index=True) # e.g. 'Route 115'
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


class Bus(Base):
    __tablename__ = "buses"

    id = Column(Integer, primary_key=True, index=True)
    bus_number = Column(String(50), unique=True, index=True)
    bus_label = Column(String(50), index=True)
    route_id = Column(String(50))
    route_name = Column(String(255))
    current_lat = Column(Float)
    current_lng = Column(Float)
    speed_kmh = Column(Float, default=28.0)
    heading = Column(Float, default=90.0)
    camera_status = Column(String(30), default="ONLINE") # 'ONLINE', 'STANDBY', 'OFFLINE'
    last_ping = Column(DateTime, default=datetime.utcnow)
    total_detections = Column(Integer, default=0)
    total_potholes = Column(Integer, default=0)
    total_vehicles = Column(Integer, default=0)


class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id = Column(Integer, primary_key=True, index=True)
    bus_id = Column(String(50), nullable=True)
    agent_name = Column(String(100), default="City AI Supervisor")
    activity_type = Column(String(50), default="DETECTION")
    message = Column(String(500))
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    severity = Column(String(20), default="INFO") # 'INFO', 'WARNING', 'CRITICAL', 'SUCCESS'
