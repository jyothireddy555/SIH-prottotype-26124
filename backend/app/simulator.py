import json
import random
import datetime
from pathlib import Path
from sqlalchemy.orm import Session

from .config import SAMPLE_FRAMES_DIR, DATA_DIR, DEFAULT_CENTER_LAT, DEFAULT_CENTER_LNG
from .models import Alert, Bus, ActivityLog, Signboard, Watchlist, WatchlistMatch
from .detector import process_frame

# Multi-City Full-Length Transit Corridors (High-Resolution Continuous Routes)
FLEET_ROUTES = {
    # === HYDERABAD TRANSIT CORRIDORS ===
    "HYD-101": {
        "city_id": "hyderabad",
        "plate": "TS-09-UB-101",
        "route_id": "Route 216",
        "route_name": "Gachibowli - Hitec City - Financial District - ORR Gateway",
        "video_stream": "/videos/bus_dashcam_feed.mp4",
        "frame_pattern": "*sus*.jpg",
        "default_lat": 17.4435,
        "default_lng": 78.3772,
        "cameras": ["CAM-1-FRONT", "CAM-2-SIDE", "CAM-3-REAR"],
        "waypoints": [
            {"seq": 1, "lat": 17.4400, "lng": 78.3480, "name": "Gachibowli Stadium Terminal", "scenario": "transit_start"},
            {"seq": 2, "lat": 17.4425, "lng": 78.3530, "name": "DLF Cyber City Gateway", "scenario": "normal"},
            {"seq": 3, "lat": 17.4460, "lng": 78.3610, "name": "IIIT Hyderabad Crossroad", "scenario": "pothole_moderate"},
            {"seq": 4, "lat": 17.4505, "lng": 78.3808, "name": "Cyber Towers Rotary Chokepoint", "scenario": "pothole_critical"},
            {"seq": 5, "lat": 17.4475, "lng": 78.3815, "name": "Hitec City Metro Station Node", "scenario": "traffic_queue"},
            {"seq": 6, "lat": 17.4430, "lng": 78.3820, "name": "Mindspace IT Park Entrance", "scenario": "normal"},
            {"seq": 7, "lat": 17.4380, "lng": 78.3850, "name": "Inorbit Mall Frontage Road", "scenario": "traffic_dense"},
            {"seq": 8, "lat": 17.4310, "lng": 78.3900, "name": "Durgam Cheruvu Cable Bridge", "scenario": "pothole_severe"},
            {"seq": 9, "lat": 17.4350, "lng": 78.3750, "name": "Knowledge City Expressway", "scenario": "normal"},
            {"seq": 10, "lat": 17.4260, "lng": 78.3580, "name": "Bio-Diversity Park Flyover", "scenario": "pothole_moderate"},
            {"seq": 11, "lat": 17.4180, "lng": 78.3440, "name": "Waverock Financial District", "scenario": "traffic_dense"},
            {"seq": 12, "lat": 17.4160, "lng": 78.3410, "name": "Wipro Circle Terminal Node", "scenario": "transit_end"}
        ]
    },
    "HYD-204": {
        "city_id": "hyderabad",
        "plate": "TS-09-EX-204",
        "route_id": "Route 10H",
        "route_name": "Mehdipatnam - Masab Tank - Lakdikapul - Secunderabad Station",
        "video_stream": "/videos/pune_monsoon.mp4",
        "frame_pattern": "*monsoon*.jpg",
        "default_lat": 17.3916,
        "default_lng": 78.4398,
        "cameras": ["CAM-1-FRONT", "CAM-2-SIDE", "CAM-3-REAR"],
        "waypoints": [
            {"seq": 1, "lat": 17.3916, "lng": 78.4398, "name": "Mehdipatnam Rythu Bazar Terminal", "scenario": "transit_start"},
            {"seq": 2, "lat": 17.3980, "lng": 78.4480, "name": "Sarojini Devi Eye Hospital", "scenario": "normal"},
            {"seq": 3, "lat": 17.4040, "lng": 78.4550, "name": "Masab Tank Flyover Ramp", "scenario": "pothole_monsoon"},
            {"seq": 4, "lat": 17.4090, "lng": 78.4620, "name": "Lakdikapul Metro Transit", "scenario": "traffic_dense"},
            {"seq": 5, "lat": 17.4150, "lng": 78.4690, "name": "Khairatabad RTA Junction", "scenario": "normal"},
            {"seq": 6, "lat": 17.4220, "lng": 78.4760, "name": "Tank Bund Promenade Frontage", "scenario": "pothole_monsoon"},
            {"seq": 7, "lat": 17.4310, "lng": 78.4870, "name": "Ranigunj Chokepoint", "scenario": "traffic_jam_22"},
            {"seq": 8, "lat": 17.4390, "lng": 78.4980, "name": "Secunderabad Station Terminal", "scenario": "transit_end"}
        ]
    },
    "HYD-305": {
        "city_id": "hyderabad",
        "plate": "TS-09-TR-305",
        "route_id": "Route 5K",
        "route_name": "Charminar - Koti - Dilsukhnagar - LB Nagar Express",
        "video_stream": "/videos/traffic_jam.mp4",
        "frame_pattern": "*traffic*.jpg",
        "default_lat": 17.3616,
        "default_lng": 78.4747,
        "cameras": ["CAM-1-FRONT", "CAM-2-SIDE", "CAM-3-REAR"],
        "waypoints": [
            {"seq": 1, "lat": 17.3616, "lng": 78.4747, "name": "Charminar Heritage Node", "scenario": "transit_start"},
            {"seq": 2, "lat": 17.3710, "lng": 78.4820, "name": "Madina Building Corridor", "scenario": "traffic_dense"},
            {"seq": 3, "lat": 17.3820, "lng": 78.4860, "name": "Koti Women's College Transit", "scenario": "traffic_jam_22"},
            {"seq": 4, "lat": 17.3750, "lng": 78.5020, "name": "Chaderghat Rotary Node", "scenario": "normal"},
            {"seq": 5, "lat": 17.3680, "lng": 78.5240, "name": "Dilsukhnagar Metro Chokepoint", "scenario": "traffic_jam_26"},
            {"seq": 6, "lat": 17.3590, "lng": 78.5480, "name": "LB Nagar Ring Road Terminal", "scenario": "transit_end"}
        ]
    },

    # === PUNE TRANSIT CORRIDORS ===
    "BUS-104": {
        "city_id": "pune",
        "plate": "MH-12-RN-104",
        "route_id": "Route 115",
        "route_name": "Sus Road - Pashan - Balewadi - Hinjewadi IT Park (West)",
        "video_stream": "/videos/bus_dashcam_feed.mp4",
        "frame_pattern": "*sus*.jpg",
        "default_lat": 18.5380,
        "default_lng": 73.7850,
        "cameras": ["CAM-1-FRONT", "CAM-2-SIDE", "CAM-3-REAR"],
        "waypoints": [
            {"seq": 1, "lat": 18.5380, "lng": 73.7850, "name": "Sus Gaon Bus Stand", "scenario": "transit_start"},
            {"seq": 2, "lat": 18.5420, "lng": 73.7815, "name": "Sus Hospital Crossroad", "scenario": "normal"},
            {"seq": 3, "lat": 18.5460, "lng": 73.7780, "name": "VTP Urban Life Junction", "scenario": "pothole_moderate"},
            {"seq": 4, "lat": 18.5500, "lng": 73.7745, "name": "KANNU KI CHAI Jcn (Broken Asphalt)", "scenario": "pothole_critical"},
            {"seq": 5, "lat": 18.5540, "lng": 73.7710, "name": "Pashan-Sus Link Road", "scenario": "pothole_severe"},
            {"seq": 6, "lat": 18.5580, "lng": 73.7675, "name": "Pashan Circle Transit Stop", "scenario": "normal"},
            {"seq": 7, "lat": 18.5620, "lng": 73.7640, "name": "Abhinav Highway Overpass", "scenario": "pothole_severe"},
            {"seq": 8, "lat": 18.5660, "lng": 73.7605, "name": "Baner-Sus Connecting Road", "scenario": "normal"},
            {"seq": 9, "lat": 18.5700, "lng": 73.7570, "name": "Radha Chowk Flyover Approach", "scenario": "pothole_moderate"},
            {"seq": 10, "lat": 18.5740, "lng": 73.7535, "name": "Balewadi Gateway Corridor", "scenario": "normal"},
            {"seq": 11, "lat": 18.5780, "lng": 73.7500, "name": "Bangalore-Mumbai Highway Link", "scenario": "traffic_moderate"},
            {"seq": 12, "lat": 18.5820, "lng": 73.7465, "name": "Wakad Bridge Junction", "scenario": "traffic_dense"},
            {"seq": 13, "lat": 18.5860, "lng": 73.7430, "name": "Bhumkar Chowk Chokepoint", "scenario": "pothole_severe"},
            {"seq": 14, "lat": 18.5900, "lng": 73.7395, "name": "Hinjewadi Bridge Gateway", "scenario": "traffic_queue"},
            {"seq": 15, "lat": 18.5940, "lng": 73.7360, "name": "Hinjewadi Shivaji Chowk", "scenario": "traffic_jam_22"},
            {"seq": 16, "lat": 18.5980, "lng": 73.7325, "name": "Infosys Circle Phase 1", "scenario": "normal"},
            {"seq": 17, "lat": 18.6020, "lng": 73.7290, "name": "Hinjewadi Phase 1 Terminal", "scenario": "transit_end"}
        ]
    },
    "BUS-218": {
        "city_id": "pune",
        "plate": "MH-12-AB-218",
        "route_id": "Route 500D",
        "route_name": "Pune Station - Nagar Road - Viman Nagar - EON IT Park (East)",
        "video_stream": "/videos/pune_monsoon.mp4",
        "frame_pattern": "*monsoon*.jpg",
        "default_lat": 18.5284,
        "default_lng": 73.8740,
        "cameras": ["CAM-1-FRONT", "CAM-2-SIDE", "CAM-3-REAR"],
        "waypoints": [
            {"seq": 1, "lat": 18.5284, "lng": 73.8740, "name": "Pune Station Bus Terminal", "scenario": "transit_start"},
            {"seq": 2, "lat": 18.5320, "lng": 73.8790, "name": "Sassoon Hospital Crossroad", "scenario": "normal"},
            {"seq": 3, "lat": 18.5360, "lng": 73.8845, "name": "Bund Garden Approach Bridge", "scenario": "normal"},
            {"seq": 4, "lat": 18.5400, "lng": 73.8900, "name": "Yerawada Bridge Chokepoint", "scenario": "traffic_dense"},
            {"seq": 5, "lat": 18.5440, "lng": 73.8955, "name": "Sadhu Vaswani Chowk", "scenario": "normal"},
            {"seq": 6, "lat": 18.5480, "lng": 73.9010, "name": "Nagar Road - Shastrinagar Jcn", "scenario": "pothole_monsoon"},
            {"seq": 7, "lat": 18.5520, "lng": 73.9065, "name": "Gunjan Chowk Transit Stop", "scenario": "normal"},
            {"seq": 8, "lat": 18.5560, "lng": 73.9120, "name": "Kalyani Nagar Flyover Ramp", "scenario": "pothole_severe"},
            {"seq": 9, "lat": 18.5600, "lng": 73.9175, "name": "Ramwadi Metro Station", "scenario": "traffic_dense"},
            {"seq": 10, "lat": 18.5640, "lng": 73.9230, "name": "Hyatt Regency Junction", "scenario": "normal"},
            {"seq": 11, "lat": 18.5680, "lng": 73.9285, "name": "Viman Nagar Main Junction", "scenario": "pothole_monsoon"},
            {"seq": 12, "lat": 18.5720, "lng": 73.9340, "name": "Phoenix Marketcity Frontage", "scenario": "traffic_dense"},
            {"seq": 13, "lat": 18.5760, "lng": 73.9395, "name": "Inorbit Flyover Approach", "scenario": "normal"},
            {"seq": 14, "lat": 18.5800, "lng": 73.9450, "name": "Chandan Nagar Water Tank", "scenario": "normal"},
            {"seq": 15, "lat": 18.5840, "lng": 73.9505, "name": "Kharadi Bypass Chowk", "scenario": "traffic_dense"},
            {"seq": 16, "lat": 18.5880, "lng": 73.9560, "name": "Radisson Blu Hotel Crossroad", "scenario": "normal"},
            {"seq": 17, "lat": 18.5920, "lng": 73.9615, "name": "World Trade Center Pune Gate", "scenario": "traffic_moderate"},
            {"seq": 18, "lat": 18.5960, "lng": 73.9670, "name": "EON Free Zone Phase 1 Terminal", "scenario": "transit_end"}
        ]
    },
    "BUS-301": {
        "city_id": "pune",
        "plate": "MH-12-TR-301",
        "route_id": "Route 335E",
        "route_name": "Katraj Tunnel - Navale Bridge - Warje - NH-48 Express Highway (South)",
        "video_stream": "/videos/traffic_jam.mp4",
        "frame_pattern": "*traffic*.jpg",
        "default_lat": 18.4480,
        "default_lng": 73.8640,
        "cameras": ["CAM-1-FRONT", "CAM-2-SIDE", "CAM-3-REAR"],
        "waypoints": [
            {"seq": 1, "lat": 18.4480, "lng": 73.8640, "name": "Katraj Tunnel Highway Toll Gate", "scenario": "transit_start"},
            {"seq": 2, "lat": 18.4530, "lng": 73.8590, "name": "Katraj Dairy Highway Ramp", "scenario": "normal"},
            {"seq": 3, "lat": 18.4580, "lng": 73.8540, "name": "Old Katraj Bypass Entrance", "scenario": "normal"},
            {"seq": 4, "lat": 18.4630, "lng": 73.8490, "name": "NH-48 New Expressway Corridor", "scenario": "traffic_dense"},
            {"seq": 5, "lat": 18.4680, "lng": 73.8440, "name": "Ambegaon Budruk Flyover", "scenario": "traffic_dense"},
            {"seq": 6, "lat": 18.4730, "lng": 73.8390, "name": "D-Mart Ambegaon Highway Node", "scenario": "traffic_jam_22"},
            {"seq": 7, "lat": 18.4780, "lng": 73.8340, "name": "Navale Bridge Expressway Junction", "scenario": "traffic_jam_26"},
            {"seq": 8, "lat": 18.4830, "lng": 73.8290, "name": "Vadgaon Budruk Flyover", "scenario": "traffic_queue"},
            {"seq": 9, "lat": 18.4880, "lng": 73.8240, "name": "Warje Flyover Approach", "scenario": "traffic_dense"},
            {"seq": 10, "lat": 18.4930, "lng": 73.8190, "name": "Warje Highway Bridge", "scenario": "traffic_moderate"},
            {"seq": 11, "lat": 18.4980, "lng": 73.8140, "name": "Atul Nagar Transit Stop", "scenario": "normal"},
            {"seq": 12, "lat": 18.5030, "lng": 73.8090, "name": "Chandani Chowk Highway Ramp", "scenario": "traffic_dense"},
            {"seq": 13, "lat": 18.5080, "lng": 73.8040, "name": "Bavdhan Express Corridor", "scenario": "normal"},
            {"seq": 14, "lat": 18.5130, "lng": 73.7990, "name": "Pashan-Bavdhan Highway Junction", "scenario": "normal"},
            {"seq": 15, "lat": 18.5180, "lng": 73.7940, "name": "Highway Terminal North", "scenario": "transit_end"}
        ]
    }
}

class SimulationState:
    def __init__(self):
        self.is_playing = False
        self.active_city_id = "hyderabad"
        self.active_bus_id = "HYD-101"
        self.active_camera_id = "CAM-1-FRONT"
        self.bus_steps = {
            "HYD-101": 0,
            "HYD-204": 0,
            "HYD-305": 0,
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
        return FLEET_ROUTES.get(self.active_bus_id, {}).get("plate", "TS-09-UB-101")

    @property
    def active_route_id(self):
        return FLEET_ROUTES.get(self.active_bus_id, {}).get("route_id", "Route 216")

    @property
    def video_stream_url(self):
        return FLEET_ROUTES.get(self.active_bus_id, {}).get("video_stream", "/videos/bus_dashcam_feed.mp4")

    @property
    def waypoints(self):
        return FLEET_ROUTES.get(self.active_bus_id, {}).get("waypoints", [])

    def set_active_city(self, city_id: str):
        self.active_city_id = city_id.lower()
        # Pick first bus belonging to that city
        for bid, cfg in FLEET_ROUTES.items():
            if cfg.get("city_id") == self.active_city_id:
                self.active_bus_id = bid
                return
        if self.active_city_id == "hyderabad":
            self.active_bus_id = "HYD-101"
        else:
            self.active_bus_id = "BUS-104"

    def set_active_bus(self, bus_id: str):
        if bus_id in FLEET_ROUTES:
            self.active_bus_id = bus_id
            self.active_city_id = FLEET_ROUTES[bus_id].get("city_id", "hyderabad")
        else:
            self.active_bus_id = "HYD-101"

    def set_active_camera(self, camera_id: str):
        self.active_camera_id = camera_id

sim_state = SimulationState()


def initialize_fleet_and_demo_data(db: Session, clean_slate: bool = False):
    """Seed initial buses along their distinct routes across Hyderabad and Pune, plus baseline signboards and watchlist"""
    existing_buses = db.query(Bus).count()
    if existing_buses == 0:
        initial_buses = [
            # === HYDERABAD FLEET ===
            Bus(
                city_id="hyderabad",
                bus_number=FLEET_ROUTES["HYD-101"]["plate"],
                bus_label="HYD-101",
                route_id=FLEET_ROUTES["HYD-101"]["route_id"],
                route_name=FLEET_ROUTES["HYD-101"]["route_name"],
                current_lat=FLEET_ROUTES["HYD-101"]["default_lat"],
                current_lng=FLEET_ROUTES["HYD-101"]["default_lng"],
                speed_kmh=0.0 if clean_slate else 36.0,
                heading=74.0,
                camera_status="ONLINE",
                active_camera="CAM-1-FRONT",
                last_ping=datetime.datetime.utcnow(),
                total_detections=0 if clean_slate else 48,
                total_potholes=0 if clean_slate else 14,
                total_vehicles=0 if clean_slate else 185
            ),
            Bus(
                city_id="hyderabad",
                bus_number=FLEET_ROUTES["HYD-204"]["plate"],
                bus_label="HYD-204",
                route_id=FLEET_ROUTES["HYD-204"]["route_id"],
                route_name=FLEET_ROUTES["HYD-204"]["route_name"],
                current_lat=FLEET_ROUTES["HYD-204"]["default_lat"],
                current_lng=FLEET_ROUTES["HYD-204"]["default_lng"],
                speed_kmh=0.0 if clean_slate else 24.0,
                heading=42.0,
                camera_status="ONLINE",
                active_camera="CAM-1-FRONT",
                last_ping=datetime.datetime.utcnow(),
                total_detections=0 if clean_slate else 32,
                total_potholes=0 if clean_slate else 9,
                total_vehicles=0 if clean_slate else 140
            ),
            Bus(
                city_id="hyderabad",
                bus_number=FLEET_ROUTES["HYD-305"]["plate"],
                bus_label="HYD-305",
                route_id=FLEET_ROUTES["HYD-305"]["route_id"],
                route_name=FLEET_ROUTES["HYD-305"]["route_name"],
                current_lat=FLEET_ROUTES["HYD-305"]["default_lat"],
                current_lng=FLEET_ROUTES["HYD-305"]["default_lng"],
                speed_kmh=0.0 if clean_slate else 18.0,
                heading=115.0,
                camera_status="ONLINE",
                active_camera="CAM-1-FRONT",
                last_ping=datetime.datetime.utcnow(),
                total_detections=0 if clean_slate else 56,
                total_potholes=0 if clean_slate else 4,
                total_vehicles=0 if clean_slate else 290
            ),

            # === PUNE FLEET ===
            Bus(
                city_id="pune",
                bus_number=FLEET_ROUTES["BUS-104"]["plate"],
                bus_label="BUS-104",
                route_id=FLEET_ROUTES["BUS-104"]["route_id"],
                route_name=FLEET_ROUTES["BUS-104"]["route_name"],
                current_lat=FLEET_ROUTES["BUS-104"]["default_lat"],
                current_lng=FLEET_ROUTES["BUS-104"]["default_lng"],
                speed_kmh=0.0 if clean_slate else 34.0,
                heading=68.0,
                camera_status="ONLINE",
                active_camera="CAM-1-FRONT",
                last_ping=datetime.datetime.utcnow(),
                total_detections=0 if clean_slate else 18,
                total_potholes=0 if clean_slate else 5,
                total_vehicles=0 if clean_slate else 82
            ),
            Bus(
                city_id="pune",
                bus_number=FLEET_ROUTES["BUS-218"]["plate"],
                bus_label="BUS-218",
                route_id=FLEET_ROUTES["BUS-218"]["route_id"],
                route_name=FLEET_ROUTES["BUS-218"]["route_name"],
                current_lat=FLEET_ROUTES["BUS-218"]["default_lat"],
                current_lng=FLEET_ROUTES["BUS-218"]["default_lng"],
                speed_kmh=0.0 if clean_slate else 26.0,
                heading=112.0,
                camera_status="ONLINE",
                active_camera="CAM-1-FRONT",
                last_ping=datetime.datetime.utcnow(),
                total_detections=0 if clean_slate else 24,
                total_potholes=0 if clean_slate else 8,
                total_vehicles=0 if clean_slate else 140
            ),
            Bus(
                city_id="pune",
                bus_number=FLEET_ROUTES["BUS-301"]["plate"],
                bus_label="BUS-301",
                route_id=FLEET_ROUTES["BUS-301"]["route_id"],
                route_name=FLEET_ROUTES["BUS-301"]["route_name"],
                current_lat=FLEET_ROUTES["BUS-301"]["default_lat"],
                current_lng=FLEET_ROUTES["BUS-301"]["default_lng"],
                speed_kmh=0.0 if clean_slate else 21.0,
                heading=240.0,
                camera_status="ONLINE",
                active_camera="CAM-1-FRONT",
                last_ping=datetime.datetime.utcnow(),
                total_detections=0 if clean_slate else 12,
                total_potholes=0 if clean_slate else 2,
                total_vehicles=0 if clean_slate else 165
            )
        ]
        db.add_all(initial_buses)
        db.commit()

        # Seed initial system logs
        db.add(ActivityLog(
            city_id="hyderabad",
            bus_id="HYD-101",
            agent_name="Hyderabad AI Supervisor",
            activity_type="SYSTEM",
            message="✨ HYDERABAD URBAN TRANSIT COMMAND: 3 Mobile Edge Nodes Online across Hitec City & Secunderabad Corridors.",
            timestamp=datetime.datetime.utcnow(),
            severity="SUCCESS"
        ))
        db.add(ActivityLog(
            city_id="pune",
            bus_id="BUS-104",
            agent_name="Pune AI Supervisor",
            activity_type="SYSTEM",
            message="✨ PUNE URBAN TRANSIT COMMAND: 3 Mobile Edge Nodes Online across Hinjewadi & Nagar Rd Corridors.",
            timestamp=datetime.datetime.utcnow(),
            severity="SUCCESS"
        ))

        if not clean_slate:
            now = datetime.datetime.utcnow()
            
            # --- SEED WATCHLIST ---
            watchlist_items = [
                Watchlist(
                    plate_number="TS09EA4412",
                    formatted_plate="TS-09-EA-4412",
                    vehicle_description="Black Yamaha R15 V3",
                    reason="STOLEN_VEHICLE (FIR #884/2026 Madhapur PS)",
                    threat_level="P0_CRITICAL",
                    active=True,
                    created_at=now - datetime.timedelta(days=2),
                    match_count=1
                ),
                Watchlist(
                    plate_number="MH12AB9901",
                    formatted_plate="MH-12-AB-9901",
                    vehicle_description="White Hyundai Creta SX",
                    reason="POLICE_WARRANT_INTERCEPT (Hit & Run Case)",
                    threat_level="P0_CRITICAL",
                    active=True,
                    created_at=now - datetime.timedelta(days=5),
                    match_count=0
                ),
                Watchlist(
                    plate_number="TS08XY2219",
                    formatted_plate="TS-08-XY-2219",
                    vehicle_description="Red Maruti Suzuki Swift",
                    reason="UNPAID_ECHALLAN_OVERDUE (>12 Overdue Violations)",
                    threat_level="P1_HIGH",
                    active=True,
                    created_at=now - datetime.timedelta(days=10),
                    match_count=2
                )
            ]
            db.add_all(watchlist_items)

            # --- SEED SIGNBOARD INVENTORY ---
            signboards = [
                Signboard(
                    signboard_code="SB-HYD-014",
                    city_id="hyderabad",
                    route_id="Route 216",
                    segment_id="SEG-216-04",
                    latitude=17.4475,
                    longitude=78.3815,
                    location_name="Cyber Towers Rotary Approach",
                    sign_type="SPEED_LIMIT_50",
                    ocr_text="SPEED LIMIT 50 KM/H - CYBERABAD POLICE",
                    reference_image_url="/uploads/sample_sus_pothole.jpg",
                    first_seen=now - datetime.timedelta(days=30),
                    last_confirmed_present=now - datetime.timedelta(hours=2),
                    missed_observations=0,
                    status="PRESENT"
                ),
                Signboard(
                    signboard_code="SB-HYD-022",
                    city_id="hyderabad",
                    route_id="Route 216",
                    segment_id="SEG-216-08",
                    latitude=17.4310,
                    longitude=78.3900,
                    location_name="Durgam Cheruvu Cable Bridge",
                    sign_type="PEDESTRIAN_CROSSING",
                    ocr_text="PEDESTRIAN CROSSING AHEAD",
                    reference_image_url="/uploads/sample_sus_pothole.jpg",
                    first_seen=now - datetime.timedelta(days=45),
                    last_confirmed_present=now - datetime.timedelta(hours=5),
                    missed_observations=0,
                    status="PRESENT"
                ),
                Signboard(
                    signboard_code="SB-HYD-039",
                    city_id="hyderabad",
                    route_id="Route 216",
                    segment_id="SEG-216-10",
                    latitude=17.4260,
                    longitude=78.3580,
                    location_name="Bio-Diversity Park Flyover",
                    sign_type="U_TURN_PROHIBITED",
                    ocr_text="NO U-TURN - HEAVY VEHICLES STRICTLY",
                    reference_image_url="/uploads/sample_sus_pothole.jpg",
                    first_seen=now - datetime.timedelta(days=60),
                    last_confirmed_present=now - datetime.timedelta(days=4),
                    missed_observations=4,
                    status="POSSIBLY_MISSING"
                ),
                Signboard(
                    signboard_code="SB-PUN-105",
                    city_id="pune",
                    route_id="Route 115",
                    segment_id="SEG-115-06",
                    latitude=18.5580,
                    longitude=73.7675,
                    location_name="Pashan Circle Transit Stop",
                    sign_type="SPEED_LIMIT_40",
                    ocr_text="SPEED LIMIT 40 KM/H PMPML",
                    reference_image_url="/uploads/sample_sus_pothole.jpg",
                    first_seen=now - datetime.timedelta(days=20),
                    last_confirmed_present=now - datetime.timedelta(hours=3),
                    missed_observations=0,
                    status="PRESENT"
                )
            ]
            db.add_all(signboards)

            # --- SEED DEMO ALERTS (ALL EDGE-AI PILLARS) ---
            initial_alerts = [
                # 1. SECURITY: Watchlist Plate Match (P0 URGENT)
                Alert(
                    alert_code="WCH-09412",
                    city_id="hyderabad",
                    alert_type="watchlist_match",
                    severity="CRITICAL",
                    priority_level="P0",
                    confidence=0.98,
                    vehicle_count=1,
                    density_level="LOW",
                    bus_id="HYD-101",
                    route_id="Route 216",
                    camera_id="CAM-1-FRONT",
                    latitude=17.4505,
                    longitude=78.3808,
                    location_name="Cyber Towers Rotary Chokepoint",
                    timestamp=now - datetime.timedelta(minutes=3),
                    first_detected_at=now - datetime.timedelta(minutes=3),
                    last_seen_at=now - datetime.timedelta(minutes=3),
                    sighting_count=3,
                    confirming_buses="HYD-101",
                    raw_image_url="/uploads/sample_traffic_jam.jpg",
                    annotated_image_url="/uploads/sample_traffic_jam.jpg",
                    status="OPEN",
                    defect_depth_est="N/A (ANPR Match)",
                    defect_area_est="Plate: TS-09-EA-4412",
                    speed_kmh=28.0,
                    ai_agent_name="ANPR Watchlist Enforcement Agent (HYD-101)"
                ),

                # 2. SAFETY: Road Accident Detection (P0 URGENT)
                Alert(
                    alert_code="ACC-70192",
                    city_id="hyderabad",
                    alert_type="accident",
                    severity="CRITICAL",
                    priority_level="P0",
                    confidence=0.94,
                    vehicle_count=2,
                    density_level="HIGH",
                    bus_id="HYD-101",
                    route_id="Route 216",
                    camera_id="CAM-1-FRONT",
                    latitude=17.4350,
                    longitude=78.3750,
                    location_name="Knowledge City Expressway Node",
                    timestamp=now - datetime.timedelta(minutes=11),
                    first_detected_at=now - datetime.timedelta(minutes=11),
                    last_seen_at=now - datetime.timedelta(minutes=11),
                    sighting_count=2,
                    confirming_buses="HYD-101",
                    raw_image_url="/uploads/sample_traffic_jam.jpg",
                    annotated_image_url="/uploads/sample_traffic_jam.jpg",
                    status="OPEN",
                    defect_depth_est="Stationary Collision Orientation",
                    defect_area_est="2-Vehicle Collision",
                    speed_kmh=12.0,
                    ai_agent_name="Safety & Accident Reasoning Agent (HYD-101)"
                ),

                # 3. ROAD DEFECT: Pothole Hotspot (P1 HIGH)
                Alert(
                    alert_code="PTH-10482",
                    city_id="hyderabad",
                    alert_type="pothole",
                    severity="CRITICAL",
                    priority_level="P1",
                    confidence=0.95,
                    vehicle_count=4,
                    density_level="LOW",
                    bus_id="HYD-101",
                    route_id="Route 216",
                    camera_id="CAM-1-FRONT",
                    latitude=17.4505,
                    longitude=78.3808,
                    location_name="Cyber Towers Rotary (Broken Asphalt)",
                    timestamp=now - datetime.timedelta(minutes=19),
                    first_detected_at=now - datetime.timedelta(minutes=19),
                    last_seen_at=now - datetime.timedelta(minutes=1),
                    sighting_count=39,
                    confirming_buses="HYD-101, HYD-204",
                    raw_image_url="/uploads/sample_sus_pothole.jpg",
                    annotated_image_url="/uploads/sample_sus_pothole.jpg",
                    status="VERIFIED",
                    defect_depth_est="~8.2 cm (Opt. Depth Index)",
                    defect_area_est="0.62 sq.m",
                    speed_kmh=31.0,
                    ai_agent_name="Road Defect Agent (HYD-101)"
                ),

                # 4. ROAD DEFECT: Severe Waterlogging (P1 HIGH)
                Alert(
                    alert_code="WLG-20194",
                    city_id="hyderabad",
                    alert_type="water_logging",
                    severity="HIGH",
                    priority_level="P1",
                    confidence=0.93,
                    vehicle_count=5,
                    density_level="MODERATE",
                    bus_id="HYD-101",
                    route_id="Route 216",
                    camera_id="CAM-1-FRONT",
                    latitude=17.4310,
                    longitude=78.3900,
                    location_name="Durgam Cheruvu Cable Bridge Approach",
                    timestamp=now - datetime.timedelta(minutes=35),
                    first_detected_at=now - datetime.timedelta(minutes=35),
                    last_seen_at=now - datetime.timedelta(minutes=2),
                    sighting_count=21,
                    confirming_buses="HYD-101",
                    raw_image_url="/uploads/sample_monsoon_pothole.jpg",
                    annotated_image_url="/uploads/sample_monsoon_pothole.jpg",
                    status="VERIFIED",
                    defect_depth_est="~6.5 cm (Puddle Water Level)",
                    defect_area_est="1.85 sq.m (Full Lane Flood)",
                    speed_kmh=19.0,
                    ai_agent_name="Waterlogging Analysis Agent (HYD-101)"
                ),

                # 5. SAFETY: Overloaded Two-Wheeler (3 Pax on Bike) (P1 HIGH)
                Alert(
                    alert_code="VIO-30911",
                    city_id="hyderabad",
                    alert_type="overloaded_two_wheeler",
                    severity="HIGH",
                    priority_level="P1",
                    confidence=0.91,
                    vehicle_count=3,
                    density_level="MODERATE",
                    bus_id="HYD-101",
                    route_id="Route 216",
                    camera_id="CAM-1-FRONT",
                    latitude=17.4475,
                    longitude=78.3815,
                    location_name="Hitec City Metro Station Node",
                    timestamp=now - datetime.timedelta(minutes=42),
                    first_detected_at=now - datetime.timedelta(minutes=42),
                    last_seen_at=now - datetime.timedelta(minutes=42),
                    sighting_count=5,
                    confirming_buses="HYD-101",
                    raw_image_url="/uploads/sample_sus_pothole.jpg",
                    annotated_image_url="/uploads/sample_sus_pothole.jpg",
                    status="OPEN",
                    defect_depth_est="3 Riders on Single Two-Wheeler",
                    defect_area_est="Rider Association Box",
                    speed_kmh=34.0,
                    ai_agent_name="Traffic Safety Enforcement Agent (HYD-101)"
                ),

                # 6. INFRASTRUCTURE: Missing Road Divider (P1 HIGH)
                Alert(
                    alert_code="DIV-40182",
                    city_id="hyderabad",
                    alert_type="missing_divider",
                    severity="HIGH",
                    priority_level="P1",
                    confidence=0.89,
                    vehicle_count=8,
                    density_level="MODERATE",
                    bus_id="HYD-101",
                    route_id="Route 216",
                    camera_id="CAM-2-SIDE",
                    latitude=17.4380,
                    longitude=78.3850,
                    location_name="Inorbit Mall Frontage Road",
                    timestamp=now - datetime.timedelta(minutes=58),
                    first_detected_at=now - datetime.timedelta(minutes=58),
                    last_seen_at=now - datetime.timedelta(minutes=5),
                    sighting_count=14,
                    confirming_buses="HYD-101",
                    raw_image_url="/uploads/sample_sus_pothole.jpg",
                    annotated_image_url="/uploads/sample_sus_pothole.jpg",
                    status="OPEN",
                    defect_depth_est="Divider Break: ~18 meters gap",
                    defect_area_est="Missing Median Barrier",
                    speed_kmh=27.0,
                    ai_agent_name="Infrastructure Integrity Agent (HYD-101)"
                ),

                # 7. INFRASTRUCTURE: Faded Zebra Crossing (P2 NORMAL)
                Alert(
                    alert_code="ZBR-50918",
                    city_id="hyderabad",
                    alert_type="zebra_fading",
                    severity="MEDIUM",
                    priority_level="P2",
                    confidence=0.91,
                    vehicle_count=2,
                    density_level="LOW",
                    bus_id="HYD-101",
                    route_id="Route 216",
                    camera_id="CAM-1-FRONT",
                    latitude=17.4425,
                    longitude=78.3530,
                    location_name="DLF Cyber City Gateway",
                    timestamp=now - datetime.timedelta(hours=1, minutes=15),
                    first_detected_at=now - datetime.timedelta(hours=1, minutes=15),
                    last_seen_at=now - datetime.timedelta(minutes=8),
                    sighting_count=19,
                    confirming_buses="HYD-101",
                    raw_image_url="/uploads/sample_sus_pothole.jpg",
                    annotated_image_url="/uploads/sample_sus_pothole.jpg",
                    status="OPEN",
                    defect_depth_est="Level 3 Heavy Fading (IRC:35-2015)",
                    defect_area_est="Pedestrian Crossing Striation",
                    speed_kmh=36.0,
                    ai_agent_name="Pavement Markings Agent (HYD-101)"
                ),

                # 8. ROAD DEFECT: Road Crack / Structural Fracture (P2 NORMAL)
                Alert(
                    alert_code="CRK-60192",
                    city_id="hyderabad",
                    alert_type="road_crack",
                    severity="MEDIUM",
                    priority_level="P2",
                    confidence=0.88,
                    vehicle_count=4,
                    density_level="LOW",
                    bus_id="HYD-101",
                    route_id="Route 216",
                    camera_id="CAM-1-FRONT",
                    latitude=17.4260,
                    longitude=78.3580,
                    location_name="Bio-Diversity Park Flyover",
                    timestamp=now - datetime.timedelta(hours=1, minutes=40),
                    first_detected_at=now - datetime.timedelta(hours=1, minutes=40),
                    last_seen_at=now - datetime.timedelta(minutes=14),
                    sighting_count=8,
                    confirming_buses="HYD-101",
                    raw_image_url="/uploads/sample_sus_pothole.jpg",
                    annotated_image_url="/uploads/sample_sus_pothole.jpg",
                    status="OPEN",
                    defect_depth_est="~3.6 cm Longitudinal Fissure",
                    defect_area_est="0.28 sq.m",
                    speed_kmh=32.0,
                    ai_agent_name="Road Defect Agent (HYD-101)"
                ),

                # 9. INFRASTRUCTURE: Roadside Garbage / Dumped Waste (P2 NORMAL)
                Alert(
                    alert_code="GAR-80122",
                    city_id="hyderabad",
                    alert_type="garbage",
                    severity="MEDIUM",
                    priority_level="P2",
                    confidence=0.87,
                    vehicle_count=6,
                    density_level="MODERATE",
                    bus_id="HYD-101",
                    route_id="Route 216",
                    camera_id="CAM-2-SIDE",
                    latitude=17.4180,
                    longitude=78.3440,
                    location_name="Waverock Financial District",
                    timestamp=now - datetime.timedelta(hours=2),
                    first_detected_at=now - datetime.timedelta(hours=2),
                    last_seen_at=now - datetime.timedelta(minutes=20),
                    sighting_count=12,
                    confirming_buses="HYD-101",
                    raw_image_url="/uploads/sample_sus_pothole.jpg",
                    annotated_image_url="/uploads/sample_sus_pothole.jpg",
                    status="OPEN",
                    defect_depth_est="Dumped Construction Waste / Debris",
                    defect_area_est="1.20 sq.m on Shoulder",
                    speed_kmh=24.0,
                    ai_agent_name="Sanitation & Road Cleanliness Agent (HYD-101)"
                ),

                # 10. TRAFFIC: Dense Flow / Congestion (P3 INFO)
                Alert(
                    alert_code="TRF-90184",
                    city_id="hyderabad",
                    alert_type="vehicle_density",
                    severity="MEDIUM",
                    priority_level="P3",
                    confidence=0.95,
                    vehicle_count=18,
                    density_level="HIGH",
                    bus_id="HYD-101",
                    route_id="Route 216",
                    camera_id="CAM-3-REAR",
                    latitude=17.4400,
                    longitude=78.3480,
                    location_name="Gachibowli Stadium Terminal",
                    timestamp=now - datetime.timedelta(minutes=6),
                    first_detected_at=now - datetime.timedelta(minutes=6),
                    last_seen_at=now - datetime.timedelta(minutes=1),
                    sighting_count=42,
                    confirming_buses="HYD-101",
                    raw_image_url="/uploads/sample_traffic_jam.jpg",
                    annotated_image_url="/uploads/sample_traffic_jam.jpg",
                    status="OPEN",
                    defect_depth_est="Vehicle Queue: ~110m",
                    defect_area_est="18 Vehicles (11 Cars, 5 Bikes, 2 Buses)",
                    speed_kmh=15.0,
                    ai_agent_name="Traffic Intelligence Agent (HYD-101)"
                ),

                # --- PUNE BASELINE ALERTS ---
                Alert(
                    alert_code="PTH-PUN-01",
                    city_id="pune",
                    alert_type="pothole",
                    severity="CRITICAL",
                    priority_level="P1",
                    confidence=0.95,
                    vehicle_count=4,
                    density_level="LOW",
                    bus_id="BUS-104",
                    route_id="Route 115",
                    camera_id="CAM-1-FRONT",
                    latitude=18.5500,
                    longitude=73.7745,
                    location_name="KANNU KI CHAI Jcn (Broken Asphalt)",
                    timestamp=now - datetime.timedelta(minutes=14),
                    first_detected_at=now - datetime.timedelta(minutes=14),
                    last_seen_at=now - datetime.timedelta(minutes=14),
                    sighting_count=31,
                    confirming_buses="BUS-104",
                    raw_image_url="/uploads/sample_sus_pothole.jpg",
                    annotated_image_url="/uploads/sample_sus_pothole.jpg",
                    status="OPEN",
                    defect_depth_est="~7.8 cm",
                    defect_area_est="0.52 sq.m",
                    speed_kmh=31.0,
                    ai_agent_name="Road Defect Agent (BUS-104)"
                ),
                Alert(
                    alert_code="PTH-PUN-02",
                    city_id="pune",
                    alert_type="pothole",
                    severity="HIGH",
                    priority_level="P1",
                    confidence=0.92,
                    vehicle_count=6,
                    density_level="MODERATE",
                    bus_id="BUS-218",
                    route_id="Route 500D",
                    camera_id="CAM-1-FRONT",
                    latitude=18.5560,
                    longitude=73.9120,
                    location_name="Kalyani Nagar Flyover Ramp",
                    timestamp=now - datetime.timedelta(minutes=22),
                    first_detected_at=now - datetime.timedelta(minutes=22),
                    last_seen_at=now - datetime.timedelta(minutes=22),
                    sighting_count=18,
                    confirming_buses="BUS-218",
                    raw_image_url="/uploads/sample_monsoon_pothole.jpg",
                    annotated_image_url="/uploads/sample_monsoon_pothole.jpg",
                    status="VERIFIED",
                    defect_depth_est="~5.4 cm",
                    defect_area_est="0.38 sq.m",
                    speed_kmh=27.0,
                    ai_agent_name="Road Defect Agent (BUS-218)"
                ),
                Alert(
                    alert_code="TRF-PUN-01",
                    city_id="pune",
                    alert_type="vehicle_density",
                    severity="HIGH",
                    priority_level="P2",
                    confidence=0.96,
                    vehicle_count=22,
                    density_level="HIGH",
                    bus_id="BUS-301",
                    route_id="Route 335E",
                    camera_id="CAM-3-REAR",
                    latitude=18.4780,
                    longitude=73.8340,
                    location_name="Navale Bridge Expressway Junction",
                    timestamp=now - datetime.timedelta(minutes=8),
                    first_detected_at=now - datetime.timedelta(minutes=8),
                    last_seen_at=now - datetime.timedelta(minutes=8),
                    sighting_count=26,
                    confirming_buses="BUS-301",
                    raw_image_url="/uploads/sample_traffic_jam.jpg",
                    annotated_image_url="/uploads/sample_traffic_jam.jpg",
                    status="OPEN",
                    speed_kmh=14.0,
                    ai_agent_name="Traffic Intelligence Agent (BUS-301)"
                )
            ]
            db.add_all(initial_alerts)
        db.commit()



def get_nearby_alert(db: Session, alert_type: str, lat: float, lng: float, radius_deg: float = 0.0006):
    """
    Finds existing road defect within ~60m spatial proximity (independent of time).
    A pothole at a specific GPS road segment is the SAME physical road depression.
    """
    return db.query(Alert).filter(
        Alert.alert_type == alert_type,
        Alert.latitude.between(lat - radius_deg, lat + radius_deg),
        Alert.longitude.between(lng - radius_deg, lng + radius_deg),
        Alert.status.in_(["OPEN", "VERIFIED", "DISPATCHED"])
    ).first()


def step_simulation(db: Session, video_progress: float = None, exact_lat: float = None, exact_lng: float = None):
    """
    Executes one deterministic step for the ACTIVE bus along its UNIQUE corridor route:
    1. Selects waypoint synced to video_progress (0.0-1.0) if provided — otherwise uses step counter
    2. Calculates physics-realistic speed based on traffic/road scenario
    3. Processes camera frame through AI detector
    4. Applies spatial deduplication and increments sighting counts for repeated passes
    5. Updates bus coordinate and telemetry in database

    SYNC FIX: video_progress maps the video timeline (0.0 → 1.0) to the route waypoint array
    so incidents are placed at the correct road segment matching what the bus camera is seeing.
    """
    import uuid
    bus_id = sim_state.active_bus_id
    bus_config = FLEET_ROUTES.get(bus_id, FLEET_ROUTES["BUS-104"])
    waypoints = bus_config["waypoints"]

    # TIMELINE SYNC FIX: Use video_progress to pick waypoint index when available.
    # This ensures detections are placed at the exact road segment the video is showing,
    # not at an arbitrary counter position that drifts from the video timeline.
    if video_progress is not None and 0.0 <= video_progress <= 1.0:
        curr_idx = int(video_progress * (len(waypoints) - 1))
        curr_idx = max(0, min(curr_idx, len(waypoints) - 1))
    else:
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

    # Generate or Update Alerts with Sighting Aggregation
    new_alerts = []

    # 1. Pothole Alert (Deduplicated within ~60m with incremental sighting count)
    if detection_res["has_pothole"]:
        existing_pothole = get_nearby_alert(db, "pothole", waypoint["lat"], waypoint["lng"])
        if existing_pothole:
            # Increment Sighting Count instead of creating a duplicate row
            existing_pothole.sighting_count = (existing_pothole.sighting_count or 1) + 1
            existing_pothole.last_seen_at = datetime.datetime.utcnow()
            existing_pothole.timestamp = datetime.datetime.utcnow()
            existing_pothole.speed_kmh = speed
            # Multi-pass verification increases confidence reliability
            existing_pothole.confidence = min(0.99, round(max(existing_pothole.confidence, detection_res["confidence"]) + 0.01, 2))
            
            # Update confirming buses list
            existing_buses = set([b.strip() for b in (existing_pothole.confirming_buses or existing_pothole.bus_id).split(",") if b.strip()])
            existing_buses.add(bus_id)
            existing_pothole.confirming_buses = ", ".join(sorted(list(existing_buses)))
            
            # Auto-promote to VERIFIED if confirmed across multiple passes or buses
            if existing_pothole.sighting_count >= 2 and existing_pothole.status == "OPEN":
                existing_pothole.status = "VERIFIED"
                
            if detection_res.get("annotated_image_url"):
                existing_pothole.annotated_image_url = detection_res.get("annotated_image_url")
                existing_pothole.raw_image_url = detection_res.get("raw_image_url")

            log = ActivityLog(
                bus_id=bus_id,
                agent_name=f"Road Defect Agent ({bus_id})",
                activity_type="CONFIRMATION",
                message=f"🔄 Sighting #{existing_pothole.sighting_count} for Pothole #{existing_pothole.alert_code} at {waypoint['name']} (Verified by {existing_pothole.confirming_buses})",
                timestamp=datetime.datetime.utcnow(),
                severity="INFO"
            )
            db.add(log)
        else:
            alert_code = f"PTH-{uuid.uuid4().hex[:6].upper()}"
            now = datetime.datetime.utcnow()
            pothole_alert = Alert(
                alert_code=alert_code,
                city_id=bus_config.get("city_id", "hyderabad"),
                alert_type="pothole",
                severity=detection_res["highest_severity"],
                priority_level="P1" if detection_res["highest_severity"] == "CRITICAL" else "P2",
                confidence=detection_res["confidence"],
                vehicle_count=detection_res["total_vehicles"],
                density_level=detection_res["density_level"],
                bus_id=bus_id,
                route_id=bus_config["route_id"],
                camera_id=sim_state.active_camera_id,
                latitude=waypoint["lat"],
                longitude=waypoint["lng"],
                location_name=waypoint["name"],
                timestamp=now,
                first_detected_at=now,
                last_seen_at=now,
                sighting_count=1,
                confirming_buses=bus_id,
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
                city_id=bus_config.get("city_id", "hyderabad"),
                bus_id=bus_id,
                agent_name=f"Road Defect Agent ({bus_id})",
                activity_type="DETECTION",
                message=f"New road defect registered #{alert_code} at {waypoint['name']} (Depth: {detection_res.get('defect_depth_est', '~5.8 cm')})",
                timestamp=now,
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
                city_id=bus_config.get("city_id", "hyderabad"),
                alert_type="vehicle_density",
                severity="HIGH" if detection_res["total_vehicles"] >= 8 else "MEDIUM",
                priority_level="P2" if detection_res["total_vehicles"] >= 8 else "P3",
                confidence=0.94,
                vehicle_count=max(detection_res["total_vehicles"], 4 if bus_id != "BUS-301" else 18),
                density_level="HIGH" if detection_res["total_vehicles"] >= 8 or bus_id == "BUS-301" else "MODERATE",
                bus_id=bus_id,
                route_id=bus_config["route_id"],
                camera_id=sim_state.active_camera_id,
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
                city_id=bus_config.get("city_id", "hyderabad"),
                bus_id=bus_id,
                agent_name=f"Traffic Intelligence Agent ({bus_id})",
                activity_type="DETECTION",
                message=f"Traffic flow active ({detection_res['total_vehicles']} vehicles) at {waypoint['name']}",
                timestamp=datetime.datetime.utcnow(),
                severity="INFO"
            )
            db.add(log)

    # Update Bus position in database
    # SYNC FIX: Prefer exact interpolated GPS from frontend when available (higher precision
    # than the coarse waypoint grid). Falls back to waypoint coords if no exact coords given.
    stored_lat = exact_lat if exact_lat is not None else waypoint["lat"]
    stored_lng = exact_lng if exact_lng is not None else waypoint["lng"]

    bus = db.query(Bus).filter(Bus.bus_label == bus_id).first()
    if bus:
        bus.current_lat = stored_lat
        bus.current_lng = stored_lng
        bus.speed_kmh = speed
        bus.last_ping = datetime.datetime.utcnow()
        bus.total_detections += len(new_alerts)
        bus.total_potholes += (1 if detection_res["has_pothole"] else 0)
        bus.total_vehicles += detection_res["total_vehicles"]

    db.commit()
    # Only advance the step counter when running in fallback (non-progress-synced) mode
    if video_progress is None:
        curr_step = sim_state.bus_steps.get(bus_id, 0)
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
