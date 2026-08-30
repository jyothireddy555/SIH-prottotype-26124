import json
import random
import datetime
from pathlib import Path
from sqlalchemy.orm import Session

from .config import SAMPLE_FRAMES_DIR, DATA_DIR, DEFAULT_CENTER_LAT, DEFAULT_CENTER_LNG
from .models import Alert, Bus, ActivityLog
from .detector import process_frame

# 3 Distinct Full-Length Urban Transit Corridors (High-Resolution Continuous Routes)
FLEET_ROUTES = {
    "BUS-104": {
        "plate": "MH-12-RN-104",
        "route_id": "Route 115",
        "route_name": "Sus Road - Pashan - Balewadi - Hinjewadi IT Park (West)",
        "video_stream": "/videos/bus_dashcam_feed.mp4",
        "frame_pattern": "*sus*.jpg",
        "default_lat": 18.5392,
        "default_lng": 73.7680,
        "waypoints": [
            {"seq": 1, "lat": 18.5392, "lng": 73.7680, "name": "Sus Gaon Bus Stand", "scenario": "transit_start"},
            {"seq": 2, "lat": 18.5420, "lng": 73.7712, "name": "Sus Hospital Crossroad", "scenario": "normal"},
            {"seq": 3, "lat": 18.5445, "lng": 73.7745, "name": "Sus Road Transit Terminal", "scenario": "normal"},
            {"seq": 4, "lat": 18.5470, "lng": 73.7772, "name": "VTP Urban Life Junction", "scenario": "pothole_moderate"},
            {"seq": 5, "lat": 18.5492, "lng": 73.7798, "name": "KANNU KI CHAI Jcn (Broken Asphalt)", "scenario": "pothole_critical"},
            {"seq": 6, "lat": 18.5515, "lng": 73.7820, "name": "VTP Urban Nest Approach Road", "scenario": "pothole_severe"},
            {"seq": 7, "lat": 18.5538, "lng": 73.7848, "name": "Nanaware Wasti Road (Broken Fissures)", "scenario": "pothole_severe"},
            {"seq": 8, "lat": 18.5562, "lng": 73.7870, "name": "Sus-Pashan Highway Link Bridge", "scenario": "normal"},
            {"seq": 9, "lat": 18.5582, "lng": 73.7892, "name": "Pashan-Sus Highway Underpass", "scenario": "pothole_moderate"},
            {"seq": 10, "lat": 18.5605, "lng": 73.7918, "name": "Pashan Lake View Corridor", "scenario": "normal"},
            {"seq": 11, "lat": 18.5628, "lng": 73.7945, "name": "Pashan Circle Transit Stop", "scenario": "traffic_moderate"},
            {"seq": 12, "lat": 18.5645, "lng": 73.7968, "name": "Abhinav College Road", "scenario": "normal"},
            {"seq": 13, "lat": 18.5675, "lng": 73.7998, "name": "Baner Main Road Corridor", "scenario": "normal"},
            {"seq": 14, "lat": 18.5702, "lng": 73.8028, "name": "Baner Phata Crossing", "scenario": "traffic_dense"},
            {"seq": 15, "lat": 18.5721, "lng": 73.8052, "name": "Balewadi High Street Chokepoint", "scenario": "pothole_critical"},
            {"seq": 16, "lat": 18.5748, "lng": 73.8080, "name": "Balewadi Stadium Main Gate", "scenario": "normal"},
            {"seq": 17, "lat": 18.5775, "lng": 73.8020, "name": "Radha Chowk Flyover Ramp", "scenario": "traffic_moderate"},
            {"seq": 18, "lat": 18.5810, "lng": 73.7920, "name": "Bangalore-Mumbai Bypass Link", "scenario": "normal"},
            {"seq": 19, "lat": 18.5860, "lng": 73.7810, "name": "Wakad Bridge Junction", "scenario": "traffic_dense"},
            {"seq": 20, "lat": 18.5910, "lng": 73.7710, "name": "Bhumkar Chowk Chokepoint", "scenario": "pothole_severe"},
            {"seq": 21, "lat": 18.5950, "lng": 73.7620, "name": "Hinjewadi Bridge Gateway", "scenario": "traffic_queue"},
            {"seq": 22, "lat": 18.5985, "lng": 73.7540, "name": "Hinjewadi Shivaji Chowk", "scenario": "traffic_jam_22"},
            {"seq": 23, "lat": 18.6015, "lng": 73.7460, "name": "Infosys Circle Phase 1", "scenario": "normal"},
            {"seq": 24, "lat": 18.6045, "lng": 73.7380, "name": "Wipro Circle Transit Stop", "scenario": "normal"},
            {"seq": 25, "lat": 18.6080, "lng": 73.7300, "name": "Hinjewadi Phase 1 Terminal", "scenario": "transit_end"}
        ]
    },
    "BUS-218": {
        "plate": "MH-12-AB-218",
        "route_id": "Route 500D",
        "route_name": "Pune Station - Nagar Road - Viman Nagar - EON IT Park (East)",
        "video_stream": "/videos/pune_monsoon.mp4",
        "frame_pattern": "*monsoon*.jpg",
        "default_lat": 18.5284,
        "default_lng": 73.8743,
        "waypoints": [
            {"seq": 1, "lat": 18.5284, "lng": 73.8743, "name": "Pune Station Bus Terminal", "scenario": "transit_start"},
            {"seq": 2, "lat": 18.5308, "lng": 73.8765, "name": "Sassoon Hospital Crossroad", "scenario": "normal"},
            {"seq": 3, "lat": 18.5342, "lng": 73.8791, "name": "Mangaldas Road Crossing", "scenario": "normal"},
            {"seq": 4, "lat": 18.5375, "lng": 73.8825, "name": "Bund Garden Approach Bridge", "scenario": "normal"},
            {"seq": 5, "lat": 18.5411, "lng": 73.8864, "name": "Yerawada Bridge Chokepoint", "scenario": "traffic_dense"},
            {"seq": 6, "lat": 18.5438, "lng": 73.8895, "name": "Sadhu Vaswani Chowk", "scenario": "normal"},
            {"seq": 7, "lat": 18.5468, "lng": 73.8927, "name": "Nagar Road - Shastrinagar Jcn", "scenario": "pothole_monsoon"},
            {"seq": 8, "lat": 18.5490, "lng": 73.8960, "name": "Golf Course Road Crossing", "scenario": "normal"},
            {"seq": 9, "lat": 18.5512, "lng": 73.8995, "name": "Gunjan Chowk Transit Stop", "scenario": "normal"},
            {"seq": 10, "lat": 18.5535, "lng": 73.9030, "name": "Bhopodi-Nagar Link Road", "scenario": "pothole_moderate"},
            {"seq": 11, "lat": 18.5558, "lng": 73.9064, "name": "Kalyani Nagar Flyover Ramp", "scenario": "pothole_severe"},
            {"seq": 12, "lat": 18.5580, "lng": 73.9100, "name": "Hermes Waves Corridor", "scenario": "normal"},
            {"seq": 13, "lat": 18.5604, "lng": 73.9142, "name": "Ramwadi Metro Station", "scenario": "traffic_dense"},
            {"seq": 14, "lat": 18.5625, "lng": 73.9180, "name": "Hyatt Regency Junction", "scenario": "normal"},
            {"seq": 15, "lat": 18.5649, "lng": 73.9218, "name": "Viman Nagar Main Junction", "scenario": "pothole_monsoon"},
            {"seq": 16, "lat": 18.5670, "lng": 73.9255, "name": "Phoenix Marketcity Frontage", "scenario": "traffic_dense"},
            {"seq": 17, "lat": 18.5700, "lng": 73.9300, "name": "Inorbit Flyover Approach", "scenario": "normal"},
            {"seq": 18, "lat": 18.5735, "lng": 73.9356, "name": "Chandan Nagar Road Defect Zone", "scenario": "pothole_severe"},
            {"seq": 19, "lat": 18.5760, "lng": 73.9400, "name": "Chandan Nagar Water Tank", "scenario": "normal"},
            {"seq": 20, "lat": 18.5790, "lng": 73.9450, "name": "Kharadi Bypass Chowk", "scenario": "traffic_dense"},
            {"seq": 21, "lat": 18.5815, "lng": 73.9485, "name": "Radisson Blu Hotel Crossroad", "scenario": "normal"},
            {"seq": 22, "lat": 18.5835, "lng": 73.9515, "name": "World Trade Center Pune Gate", "scenario": "traffic_moderate"},
            {"seq": 23, "lat": 18.5855, "lng": 73.9545, "name": "Grant Road IT Hub", "scenario": "pothole_moderate"},
            {"seq": 24, "lat": 18.5880, "lng": 73.9575, "name": "EON Free Zone Phase 1 Terminal", "scenario": "transit_end"}
        ]
    },
    "BUS-301": {
        "plate": "MH-12-TR-301",
        "route_id": "Route 335E",
        "route_name": "Swargate - Katraj Ghat - NH-48 Bypass - Warje Corridor (South)",
        "video_stream": "/videos/traffic_jam.mp4",
        "frame_pattern": "*traffic*.jpg",
        "default_lat": 18.5015,
        "default_lng": 73.8580,
        "waypoints": [
            {"seq": 1, "lat": 18.5015, "lng": 73.8580, "name": "Swargate Central Bus Station", "scenario": "transit_start"},
            {"seq": 2, "lat": 18.4965, "lng": 73.8588, "name": "Laxmi Narayan Theater Crossing", "scenario": "normal"},
            {"seq": 3, "lat": 18.4920, "lng": 73.8595, "name": "Satara Road Transit Corridor", "scenario": "traffic_dense_14"},
            {"seq": 4, "lat": 18.4865, "lng": 73.8602, "name": "Panchami Hotel Junction", "scenario": "traffic_dense"},
            {"seq": 5, "lat": 18.4815, "lng": 73.8612, "name": "Bibvewadi Highway Chokepoint", "scenario": "traffic_queue_18"},
            {"seq": 6, "lat": 18.4750, "lng": 73.8620, "name": "Padmavati Transit Stop", "scenario": "normal"},
            {"seq": 7, "lat": 18.4685, "lng": 73.8628, "name": "Katraj Bypass Flyover Approach", "scenario": "traffic_jam_22"},
            {"seq": 8, "lat": 18.4620, "lng": 73.8638, "name": "Katraj Dairy Roundabout", "scenario": "traffic_dense"},
            {"seq": 9, "lat": 18.4550, "lng": 73.8645, "name": "Highway Tollway Tourist Chokepoint", "scenario": "traffic_jam_26"},
            {"seq": 10, "lat": 18.4510, "lng": 73.8580, "name": "Katraj Ghat Tunnel Approach", "scenario": "traffic_dense_14"},
            {"seq": 11, "lat": 18.4480, "lng": 73.8510, "name": "Old Katraj Tunnel Entrance", "scenario": "normal"},
            {"seq": 12, "lat": 18.4530, "lng": 73.8420, "name": "NH-48 New Bypass Highway", "scenario": "normal"},
            {"seq": 13, "lat": 18.4610, "lng": 73.8340, "name": "Ambegaon Budruk Flyover", "scenario": "traffic_dense"},
            {"seq": 14, "lat": 18.4700, "lng": 73.8260, "name": "D-Mart Ambegaon Junction", "scenario": "traffic_jam_22"},
            {"seq": 15, "lat": 18.4790, "lng": 73.8180, "name": "Navale Bridge Highway Chokepoint", "scenario": "traffic_jam_26"},
            {"seq": 16, "lat": 18.4870, "lng": 73.8110, "name": "Vadgaon Budruk Flyover", "scenario": "traffic_queue"},
            {"seq": 17, "lat": 18.4960, "lng": 73.8030, "name": "Warje Flyover Approach", "scenario": "traffic_dense"},
            {"seq": 18, "lat": 18.5040, "lng": 73.7960, "name": "Warje Highway Bridge", "scenario": "traffic_moderate"},
            {"seq": 19, "lat": 18.5120, "lng": 73.7890, "name": "Atul Nagar Transit Stop", "scenario": "normal"},
            {"seq": 20, "lat": 18.5190, "lng": 73.7820, "name": "Chandani Chowk Multi-Level Flyover", "scenario": "traffic_dense"},
            {"seq": 21, "lat": 18.5260, "lng": 73.7760, "name": "Bavdhan Highway Junction", "scenario": "normal"},
            {"seq": 22, "lat": 18.5340, "lng": 73.7710, "name": "Pashan-Bavdhan Highway Terminal", "scenario": "transit_end"}
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


def get_nearby_alert(db: Session, alert_type: str, lat: float, lng: float, radius_deg: float = 0.0025):
    """Finds existing alert within ~250m radius logged recently to prevent duplicate map clutter"""
    cutoff = datetime.datetime.utcnow() - datetime.timedelta(minutes=15)
    return db.query(Alert).filter(
        Alert.alert_type == alert_type,
        Alert.latitude.between(lat - radius_deg, lat + radius_deg),
        Alert.longitude.between(lng - radius_deg, lng + radius_deg),
        Alert.timestamp >= cutoff
    ).first()


def step_simulation(db: Session):
    """
    Executes one deterministic step for the ACTIVE bus along its UNIQUE corridor route:
    1. Selects next waypoint on the active bus's route
    2. Calculates physics-realistic speed based on traffic/road scenario
    3. Processes camera frame through AI detector
    4. Applies spatial deduplication to prevent duplicate alert pin clutter
    5. Updates bus coordinate and telemetry in database
    """
    import uuid
    bus_id = sim_state.active_bus_id
    bus_config = FLEET_ROUTES.get(bus_id, FLEET_ROUTES["BUS-104"])
    waypoints = bus_config["waypoints"]

    curr_step = sim_state.bus_steps.get(bus_id, 0)
    curr_idx = curr_step % len(waypoints)
    waypoint = waypoints[curr_idx]
    scenario = waypoint.get("scenario", "normal")

    # Scenario-grounded realistic transit speed (km/h)
    if "traffic_jam" in scenario or "traffic_queue" in scenario:
        speed = round(random.uniform(9.0, 15.0), 1)
    elif "traffic_dense" in scenario or "chokepoint" in scenario:
        speed = round(random.uniform(16.0, 23.0), 1)
    elif "pothole_severe" in scenario or "pothole_critical" in scenario or "broken" in waypoint["name"].lower():
        speed = round(random.uniform(18.0, 27.0), 1)
    elif "transit_start" in scenario or "transit_end" in scenario:
        speed = round(random.uniform(14.0, 22.0), 1)
    else:
        speed = round(random.uniform(32.0, 42.0), 1)

    # Find sample frames matching this bus's video pattern
    pattern = bus_config["frame_pattern"]
    matching_frames = []
    if SAMPLE_FRAMES_DIR.exists():
        matching_frames = sorted(list(SAMPLE_FRAMES_DIR.glob(pattern)))

    frame_path = None
    if matching_frames:
        frame_idx = curr_step % len(matching_frames)
        frame_path = matching_frames[frame_idx]

    # Process frame through AI pipeline
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
        # Ensure defect hotspots reliably trigger pothole alerts on broken road sections
        if "pothole" in scenario or "broken" in scenario or "broken" in waypoint["name"].lower() or "defect" in waypoint["name"].lower():
            detection_res["has_pothole"] = True
            detection_res["pothole_count"] = max(detection_res.get("pothole_count", 0), 1)
            detection_res["highest_severity"] = "CRITICAL" if "critical" in scenario else "HIGH"
            detection_res["confidence"] = max(detection_res.get("confidence", 0.94), 0.94)
            if not detection_res.get("defect_depth_est"):
                detection_res["defect_depth_est"] = "~7.2 cm (Opt. Depth Index)"
            if not detection_res.get("defect_area_est"):
                detection_res["defect_area_est"] = "0.52 sq.m"
    else:
        # Fallback simulation with grounded defect geometry
        is_traffic_route = (bus_id == "BUS-301")
        has_pothole = not is_traffic_route and ("pothole" in scenario or "broken" in scenario or curr_idx % 2 == 1)
        vehicles = random.randint(16, 26) if is_traffic_route else random.randint(3, 8)
        density = "HIGH" if vehicles >= 8 else "MODERATE" if vehicles >= 4 else "LOW"

        detection_res = {
            "raw_image_url": None,
            "annotated_image_url": None,
            "total_vehicles": vehicles,
            "vehicle_counts": {"car": int(vehicles*0.65), "motorcycle": int(vehicles*0.25), "bus": 1, "truck": 1},
            "density_level": density,
            "potholes": [{
                "bbox": [200, 300, 420, 440], 
                "confidence": 0.94, 
                "severity": "CRITICAL" if "critical" in scenario else "HIGH",
                "defect_depth_est": "~6.8 cm (Opt. Depth Index)",
                "defect_area_est": "0.48 sq.m"
            }] if has_pothole else [],
            "has_pothole": has_pothole,
            "pothole_count": 1 if has_pothole else 0,
            "highest_severity": "CRITICAL" if "critical" in scenario else ("HIGH" if has_pothole else "LOW"),
            "confidence": 0.94 if has_pothole else 0.88,
            "defect_depth_est": "~6.8 cm (Opt. Depth Index)",
            "defect_area_est": "0.48 sq.m",
            "bus_id": bus_id,
            "route_id": bus_config["route_id"],
            "speed_kmh": speed,
            "gps_lat": waypoint["lat"],
            "gps_lng": waypoint["lng"],
            "location_name": waypoint["name"]
        }

    # Generate or Update Alerts with Spatial Deduplication
    new_alerts = []

    # 1. Pothole Alert (Deduplicated within 250m)
    if detection_res["has_pothole"]:
        existing_pothole = get_nearby_alert(db, "pothole", waypoint["lat"], waypoint["lng"])
        if existing_pothole:
            # Update existing alert telemetry
            existing_pothole.timestamp = datetime.datetime.utcnow()
            existing_pothole.confidence = max(existing_pothole.confidence, detection_res["confidence"])
            existing_pothole.speed_kmh = speed
        else:
            alert_code = f"PTH-{uuid.uuid4().hex[:6].upper()}"
            pothole_alert = Alert(
                alert_code=alert_code,
                alert_type="pothole",
                severity=detection_res["highest_severity"],
                confidence=detection_res["confidence"],
                vehicle_count=detection_res["total_vehicles"],
                density_level=detection_res["density_level"],
                bus_id=bus_id,
                route_id=bus_config["route_id"],
                latitude=waypoint["lat"],
                longitude=waypoint["lng"],
                location_name=waypoint["name"],
                timestamp=datetime.datetime.utcnow(),
                raw_image_url=detection_res.get("raw_image_url"),
                annotated_image_url=detection_res.get("annotated_image_url"),
                status="OPEN",
                defect_depth_est=detection_res.get("defect_depth_est", "~5.8 cm (Opt. Depth Index)"),
                defect_area_est=detection_res.get("defect_area_est", "0.42 sq.m"),
                speed_kmh=speed,
                ai_agent_name=f"Road Defect Agent ({bus_id})"
            )
            db.add(pothole_alert)
            new_alerts.append(alert_code)

            log = ActivityLog(
                bus_id=bus_id,
                agent_name=f"Road Defect Agent ({bus_id})",
                activity_type="DETECTION",
                message=f"Pothole detected at {waypoint['name']} (Conf: {int(detection_res['confidence']*100)}%, Depth: {detection_res.get('defect_depth_est', '~5.8 cm')})",
                timestamp=datetime.datetime.utcnow(),
                severity="CRITICAL" if detection_res["highest_severity"] == "CRITICAL" else "WARNING"
            )
            db.add(log)

    # 2. Traffic Flow & Density Alert (Deduplicated within 250m)
    if detection_res["total_vehicles"] >= 4 or detection_res["density_level"] in ["HIGH", "MODERATE"] or bus_id == "BUS-301":
        existing_traffic = get_nearby_alert(db, "vehicle_density", waypoint["lat"], waypoint["lng"])
        if existing_traffic:
            # Update existing density record
            existing_traffic.vehicle_count = detection_res["total_vehicles"]
            existing_traffic.density_level = detection_res["density_level"]
            existing_traffic.timestamp = datetime.datetime.utcnow()
            existing_traffic.speed_kmh = speed
        else:
            alert_code = f"TRF-{uuid.uuid4().hex[:6].upper()}"
            traffic_alert = Alert(
                alert_code=alert_code,
                alert_type="vehicle_density",
                severity="HIGH" if detection_res["total_vehicles"] >= 8 else "MEDIUM",
                confidence=0.94,
                vehicle_count=max(detection_res["total_vehicles"], 4 if bus_id != "BUS-301" else 18),
                density_level="HIGH" if detection_res["total_vehicles"] >= 8 or bus_id == "BUS-301" else "MODERATE",
                bus_id=bus_id,
                route_id=bus_config["route_id"],
                latitude=waypoint["lat"],
                longitude=waypoint["lng"],
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

            log = ActivityLog(
                bus_id=bus_id,
                agent_name=f"Traffic Intelligence Agent ({bus_id})",
                activity_type="DETECTION",
                message=f"Traffic flow active ({detection_res['total_vehicles']} vehicles) at {waypoint['name']}",
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
