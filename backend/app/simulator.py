import json
import random
import datetime
from pathlib import Path
from sqlalchemy.orm import Session

from .config import SAMPLE_FRAMES_DIR, DATA_DIR, DEFAULT_CENTER_LAT, DEFAULT_CENTER_LNG
from .models import Alert, Bus, ActivityLog
from .detector import process_frame

# 3 Distinct Routes for the 3 Public Transit Buses
FLEET_ROUTES = {
    "BUS-104": {
        "plate": "MH-12-RN-104",
        "route_id": "Route 115",
        "route_name": "Sus Road & Pashan Corridor (West)",
        "video_stream": "/videos/bus_dashcam_feed.mp4",
        "frame_pattern": "*sus*.jpg",
        "default_lat": 18.5445,
        "default_lng": 73.7745,
        "waypoints": [
            {"seq": 1, "lat": 18.5445, "lng": 73.7745, "name": "Sus Road Transit Terminal", "scenario": "normal"},
            {"seq": 2, "lat": 18.5492, "lng": 73.7798, "name": "KANNU KI CHAI Jcn (Broken Asphalt)", "scenario": "pothole_critical"},
            {"seq": 3, "lat": 18.5535, "lng": 73.7845, "name": "VTP Urban Nest Approach Road", "scenario": "pothole_severe"},
            {"seq": 4, "lat": 18.5582, "lng": 73.7892, "name": "Pashan-Sus Highway Underpass", "scenario": "pothole_moderate"},
            {"seq": 5, "lat": 18.5628, "lng": 73.7945, "name": "Pashan Circle Transit Stop", "scenario": "traffic_moderate"},
            {"seq": 6, "lat": 18.5675, "lng": 73.7998, "name": "Baner Main Road Corridor", "scenario": "normal"},
            {"seq": 7, "lat": 18.5721, "lng": 73.8052, "name": "Balewadi High Street Chokepoint", "scenario": "pothole_cluster"},
            {"seq": 8, "lat": 18.5780, "lng": 73.8115, "name": "Hinjewadi Phase 1 Gateway", "scenario": "transit_end"}
        ]
    },
    "BUS-218": {
        "plate": "MH-12-AB-218",
        "route_id": "Route 500D",
        "route_name": "Pune Nagar Road & Monsoon Corridor (East)",
        "video_stream": "/videos/pune_monsoon.mp4",
        "frame_pattern": "*monsoon*.jpg",
        "default_lat": 18.5284,
        "default_lng": 73.8743,
        "waypoints": [
            {"seq": 1, "lat": 18.5284, "lng": 73.8743, "name": "Pune Station Bus Terminal", "scenario": "transit_start"},
            {"seq": 2, "lat": 18.5342, "lng": 73.8791, "name": "Mangaldas Road Crossing", "scenario": "normal"},
            {"seq": 3, "lat": 18.5411, "lng": 73.8864, "name": "Yerawada Bridge Chokepoint", "scenario": "traffic_dense"},
            {"seq": 4, "lat": 18.5468, "lng": 73.8927, "name": "Nagar Road - Shastrinagar Jcn", "scenario": "pothole_monsoon"},
            {"seq": 5, "lat": 18.5512, "lng": 73.8995, "name": "Gunjan Chowk Transit Stop", "scenario": "normal"},
            {"seq": 6, "lat": 18.5558, "lng": 73.9064, "name": "Kalyani Nagar Flyover Ramp", "scenario": "pothole_severe"},
            {"seq": 7, "lat": 18.5604, "lng": 73.9142, "name": "Ramwadi Metro Station", "scenario": "traffic_dense"},
            {"seq": 8, "lat": 18.5649, "lng": 73.9218, "name": "Viman Nagar Main Junction", "scenario": "pothole_monsoon"},
            {"seq": 9, "lat": 18.5735, "lng": 73.9356, "name": "Chandan Nagar Road Defect Zone", "scenario": "pothole_severe"},
            {"seq": 10, "lat": 18.5864, "lng": 73.9559, "name": "EON IT Park Phase 1 Terminal", "scenario": "transit_end"}
        ]
    },
    "BUS-301": {
        "plate": "MH-12-TR-301",
        "route_id": "Route 335E",
        "route_name": "Tourist Highway & Bypass Flow (South)",
        "video_stream": "/videos/traffic_jam.mp4",
        "frame_pattern": "*traffic*.jpg",
        "default_lat": 18.5015,
        "default_lng": 73.8580,
        "waypoints": [
            {"seq": 1, "lat": 18.5015, "lng": 73.8580, "name": "Swargate Central Bus Station", "scenario": "transit_start"},
            {"seq": 2, "lat": 18.4920, "lng": 73.8595, "name": "Satara Road Transit Corridor", "scenario": "traffic_dense_14"},
            {"seq": 3, "lat": 18.4815, "lng": 73.8612, "name": "Bibvewadi Highway Chokepoint", "scenario": "traffic_queue_18"},
            {"seq": 4, "lat": 18.4685, "lng": 73.8628, "name": "Katraj Bypass Flyover Approach", "scenario": "traffic_jam_22"},
            {"seq": 5, "lat": 18.4550, "lng": 73.8645, "name": "Highway Tollway Tourist Chokepoint", "scenario": "traffic_jam_26"},
            {"seq": 6, "lat": 18.4620, "lng": 73.8780, "name": "Kondhwa Bypass Junction", "scenario": "road_fracture"},
            {"seq": 7, "lat": 18.4740, "lng": 73.8890, "name": "Wanowrie Transit Hub", "scenario": "traffic_moderate"},
            {"seq": 8, "lat": 18.4850, "lng": 73.8990, "name": "Hadapsar Transit Terminal", "scenario": "transit_end"}
        ]
    }
}

class SimulationState:
    def __init__(self):
        self.is_playing = False
        self.active_bus_id = "BUS-104"
        self.bus_steps = {
            "BUS-104": 0,
            "BUS-218": 0,
            "BUS-301": 0
        }
        self.speed_multiplier = 1.0

    @property
    def current_step(self):
        return self.bus_steps.get(self.active_bus_id, 0)

    @property
    def active_route_name(self):
        return FLEET_ROUTES.get(self.active_bus_id, {}).get("route_name", "Transit Corridor")

    @property
    def active_bus_plate(self):
        return FLEET_ROUTES.get(self.active_bus_id, {}).get("plate", "MH-12-RN-104")

    @property
    def active_route_id(self):
        return FLEET_ROUTES.get(self.active_bus_id, {}).get("route_id", "Route 115")

    @property
    def video_stream_url(self):
        return FLEET_ROUTES.get(self.active_bus_id, {}).get("video_stream", "/videos/bus_dashcam_feed.mp4")

    @property
    def waypoints(self):
        return FLEET_ROUTES.get(self.active_bus_id, {}).get("waypoints", [])

    def set_active_bus(self, bus_id: str):
        if bus_id in FLEET_ROUTES:
            self.active_bus_id = bus_id
        else:
            self.active_bus_id = "BUS-104"

sim_state = SimulationState()

def initialize_fleet_and_demo_data(db: Session, clean_slate: bool = False):
    """Seed initial buses along their distinct routes"""
    existing_buses = db.query(Bus).count()
    if existing_buses == 0:
        initial_buses = [
            Bus(
                bus_number=FLEET_ROUTES["BUS-104"]["plate"],
                bus_label="BUS-104",
                route_id=FLEET_ROUTES["BUS-104"]["route_id"],
                route_name=FLEET_ROUTES["BUS-104"]["route_name"],
                current_lat=FLEET_ROUTES["BUS-104"]["default_lat"],
                current_lng=FLEET_ROUTES["BUS-104"]["default_lng"],
                speed_kmh=0.0 if clean_slate else 34.0,
                heading=68.0,
                camera_status="ONLINE",
                last_ping=datetime.datetime.utcnow(),
                total_detections=0 if clean_slate else 18,
                total_potholes=0 if clean_slate else 5,
                total_vehicles=0 if clean_slate else 82
            ),
            Bus(
                bus_number=FLEET_ROUTES["BUS-218"]["plate"],
                bus_label="BUS-218",
                route_id=FLEET_ROUTES["BUS-218"]["route_id"],
                route_name=FLEET_ROUTES["BUS-218"]["route_name"],
                current_lat=FLEET_ROUTES["BUS-218"]["default_lat"],
                current_lng=FLEET_ROUTES["BUS-218"]["default_lng"],
                speed_kmh=0.0 if clean_slate else 26.0,
                heading=112.0,
                camera_status="ONLINE",
                last_ping=datetime.datetime.utcnow(),
                total_detections=0 if clean_slate else 24,
                total_potholes=0 if clean_slate else 8,
                total_vehicles=0 if clean_slate else 140
            ),
            Bus(
                bus_number=FLEET_ROUTES["BUS-301"]["plate"],
                bus_label="BUS-301",
                route_id=FLEET_ROUTES["BUS-301"]["route_id"],
                route_name=FLEET_ROUTES["BUS-301"]["route_name"],
                current_lat=FLEET_ROUTES["BUS-301"]["default_lat"],
                current_lng=FLEET_ROUTES["BUS-301"]["default_lng"],
                speed_kmh=0.0 if clean_slate else 21.0,
                heading=240.0,
                camera_status="ONLINE",
                last_ping=datetime.datetime.utcnow(),
                total_detections=0 if clean_slate else 12,
                total_potholes=0 if clean_slate else 2,
                total_vehicles=0 if clean_slate else 165
            )
        ]
        db.add_all(initial_buses)
        db.commit()

        # Seed initial system log
        log = ActivityLog(
            bus_id="BUS-104",
            agent_name="City AI Supervisor",
            activity_type="SYSTEM",
            message="✨ ROADWISE Clean Slate Initialized for Jury Demo. 3 Mobile Edge Nodes Ready.",
            timestamp=datetime.datetime.utcnow(),
            severity="SUCCESS"
        )
        db.add(log)

        if not clean_slate:
            # Seed sample baseline alerts
            initial_alerts = [
                Alert(
                    alert_code="PTH-10482",
                    alert_type="pothole",
                    severity="CRITICAL",
                    confidence=0.95,
                    vehicle_count=4,
                    density_level="LOW",
                    bus_id="BUS-104",
                    route_id="Route 115",
                    latitude=18.5492,
                    longitude=73.7798,
                    location_name="KANNU KI CHAI Jcn (Broken Asphalt)",
                    timestamp=datetime.datetime.utcnow() - datetime.timedelta(minutes=14),
                    raw_image_url="/uploads/sample_sus_pothole.jpg",
                    annotated_image_url="/uploads/sample_sus_pothole.jpg",
                    status="OPEN",
                    defect_depth_est="~7.8 cm",
                    defect_area_est="0.52 sq.m",
                    speed_kmh=31.0,
                    ai_agent_name="Road Defect Agent (BUS-104)"
                ),
                Alert(
                    alert_code="PTH-20941",
                    alert_type="pothole",
                    severity="HIGH",
                    confidence=0.92,
                    vehicle_count=6,
                    density_level="MODERATE",
                    bus_id="BUS-218",
                    route_id="Route 500D",
                    latitude=18.5558,
                    longitude=73.9064,
                    location_name="Kalyani Nagar Flyover Ramp",
                    timestamp=datetime.datetime.utcnow() - datetime.timedelta(minutes=22),
                    raw_image_url="/uploads/sample_monsoon_pothole.jpg",
                    annotated_image_url="/uploads/sample_monsoon_pothole.jpg",
                    status="VERIFIED",
                    defect_depth_est="~5.4 cm",
                    defect_area_est="0.38 sq.m",
                    speed_kmh=27.0,
                    ai_agent_name="Road Defect Agent (BUS-218)"
                ),
                Alert(
                    alert_code="TRF-30812",
                    alert_type="vehicle_density",
                    severity="HIGH",
                    confidence=0.96,
                    vehicle_count=22,
                    density_level="HIGH",
                    bus_id="BUS-301",
                    route_id="Route 335E",
                    latitude=18.4685,
                    longitude=73.8628,
                    location_name="Katraj Bypass Flyover Approach",
                    timestamp=datetime.datetime.utcnow() - datetime.timedelta(minutes=8),
                    raw_image_url="/uploads/sample_traffic_jam.jpg",
                    annotated_image_url="/uploads/sample_traffic_jam.jpg",
                    status="OPEN",
                    speed_kmh=14.0,
                    ai_agent_name="Traffic Intelligence Agent (BUS-301)"
                )
            ]
            db.add_all(initial_alerts)
        db.commit()


def step_simulation(db: Session):
    """
    Executes one deterministic step for the ACTIVE bus along its UNIQUE corridor route:
    1. Selects next waypoint on the active bus's route
    2. Selects sample frame from that specific video
    3. Runs AI detector
    4. Drops geolocated alert on that bus's route
    5. Updates bus coordinate on the map
    """
    bus_id = sim_state.active_bus_id
    bus_config = FLEET_ROUTES.get(bus_id, FLEET_ROUTES["BUS-104"])
    waypoints = bus_config["waypoints"]

    curr_step = sim_state.bus_steps.get(bus_id, 0)
    curr_idx = curr_step % len(waypoints)
    waypoint = waypoints[curr_idx]

    # Find sample frames matching this bus's video pattern
    pattern = bus_config["frame_pattern"]
    matching_frames = []
    if SAMPLE_FRAMES_DIR.exists():
        matching_frames = sorted(list(SAMPLE_FRAMES_DIR.glob(pattern)))

    frame_path = None
    if matching_frames:
        frame_idx = curr_step % len(matching_frames)
        frame_path = matching_frames[frame_idx]

    # Realistic speed variation
    speed = round(random.uniform(26.0, 38.0), 1)

    # Process frame through AI pipeline
    detection_res = None
    if frame_path and frame_path.exists():
        detection_res = process_frame(
            image_input=frame_path,
            bus_id=bus_id,
            route_id=bus_config["route_id"],
            speed_kmh=speed,
            gps_lat=waypoint["lat"],
            gps_lng=waypoint["lng"],
            location_name=waypoint["name"]
        )
    else:
        # Fallback simulation tailored to route
        is_traffic_route = (bus_id == "BUS-301")
        has_pothole = not is_traffic_route and (curr_idx % 2 == 1)
        vehicles = random.randint(14, 24) if is_traffic_route else random.randint(3, 9)
        density = "HIGH" if vehicles > 10 else "MODERATE" if vehicles > 5 else "LOW"

        detection_res = {
            "raw_image_url": None,
            "annotated_image_url": None,
            "total_vehicles": vehicles,
            "vehicle_counts": {"car": int(vehicles*0.6), "motorcycle": int(vehicles*0.3), "bus": 2, "truck": 1},
            "density_level": density,
            "potholes": [{"bbox": [200, 300, 400, 450], "confidence": 0.94, "severity": "HIGH"}] if has_pothole else [],
            "has_pothole": has_pothole,
            "pothole_count": 1 if has_pothole else 0,
            "highest_severity": "HIGH" if has_pothole else "LOW",
            "confidence": 0.94 if has_pothole else 0.88,
            "bus_id": bus_id,
            "route_id": bus_config["route_id"],
            "speed_kmh": speed,
            "gps_lat": waypoint["lat"],
            "gps_lng": waypoint["lng"],
            "location_name": waypoint["name"]
        }

    # Generate Alerts & Activity Logs
    new_alerts = []

    # 1. Pothole Alert
    if detection_res["has_pothole"]:
        code_num = random.randint(10000, 99999)
        alert_code = f"PTH-{code_num}"
        pothole_alert = Alert(
            alert_code=alert_code,
            alert_type="pothole",
            severity=detection_res["highest_severity"],
            confidence=detection_res["confidence"],
            vehicle_count=detection_res["total_vehicles"],
            density_level=detection_res["density_level"],
            bus_id=bus_id,
            route_id=bus_config["route_id"],
            latitude=waypoint["lat"] + random.uniform(-0.0001, 0.0001),
            longitude=waypoint["lng"] + random.uniform(-0.0001, 0.0001),
            location_name=waypoint["name"],
            timestamp=datetime.datetime.utcnow(),
            raw_image_url=detection_res.get("raw_image_url"),
            annotated_image_url=detection_res.get("annotated_image_url"),
            status="OPEN",
            defect_depth_est=f"~{random.uniform(4.5, 8.5):.1f} cm",
            defect_area_est=f"{random.uniform(0.28, 0.65):.2f} sq.m",
            speed_kmh=speed,
            ai_agent_name=f"Road Defect Agent ({bus_id})"
        )
        db.add(pothole_alert)
        new_alerts.append(alert_code)

        # Log Activity
        log = ActivityLog(
            bus_id=bus_id,
            agent_name=f"Road Defect Agent ({bus_id})",
            activity_type="DETECTION",
            message=f"Pothole detected at {waypoint['name']} (Conf: {int(detection_res['confidence']*100)}%, Sev: {detection_res['highest_severity']})",
            timestamp=datetime.datetime.utcnow(),
            severity="CRITICAL" if detection_res["highest_severity"] == "CRITICAL" else "WARNING"
        )
        db.add(log)

    # 2. Vehicle Flow & Traffic Density Alert
    if detection_res["total_vehicles"] >= 4 or detection_res["density_level"] in ["HIGH", "MODERATE"] or bus_id == "BUS-301":
        code_num = random.randint(10000, 99999)
        alert_code = f"TRF-{code_num}"
        traffic_alert = Alert(
            alert_code=alert_code,
            alert_type="vehicle_density",
            severity="HIGH" if detection_res["total_vehicles"] >= 8 else "MEDIUM",
            confidence=0.94,
            vehicle_count=max(detection_res["total_vehicles"], 4 if bus_id != "BUS-301" else 18),
            density_level="HIGH" if detection_res["total_vehicles"] >= 8 or bus_id == "BUS-301" else "MODERATE",
            bus_id=bus_id,
            route_id=bus_config["route_id"],
            latitude=waypoint["lat"] + random.uniform(-0.0001, 0.0001),
            longitude=waypoint["lng"] + random.uniform(-0.0001, 0.0001),
            location_name=waypoint["name"],
            timestamp=datetime.datetime.utcnow(),
            raw_image_url=detection_res.get("raw_image_url"),
            annotated_image_url=detection_res.get("annotated_image_url"),
            status="OPEN",
            speed_kmh=speed,
            ai_agent_name=f"Traffic Intelligence Agent ({bus_id})"
        )
        db.add(traffic_alert)
        new_alerts.append(alert_code)

        # Log Activity
        log = ActivityLog(
            bus_id=bus_id,
            agent_name=f"Traffic Intelligence Agent ({bus_id})",
            activity_type="DETECTION",
            message=f"Traffic flow active ({detection_res['total_vehicles']} vehicles detected) at {waypoint['name']}",
            timestamp=datetime.datetime.utcnow(),
            severity="INFO"
        )
        db.add(log)

    # Update Bus position in database
    bus = db.query(Bus).filter(Bus.bus_label == bus_id).first()
    if bus:
        bus.current_lat = waypoint["lat"]
        bus.current_lng = waypoint["lng"]
        bus.speed_kmh = speed
        bus.last_ping = datetime.datetime.utcnow()
        bus.total_detections += len(new_alerts)
        bus.total_potholes += (1 if detection_res["has_pothole"] else 0)
        bus.total_vehicles += detection_res["total_vehicles"]

    db.commit()
    sim_state.bus_steps[bus_id] = curr_step + 1

    return {
        "step": sim_state.bus_steps[bus_id],
        "bus_id": bus_id,
        "route_name": bus_config["route_name"],
        "waypoint": waypoint,
        "speed_kmh": speed,
        "detection": detection_res,
        "new_alerts": new_alerts
    }
