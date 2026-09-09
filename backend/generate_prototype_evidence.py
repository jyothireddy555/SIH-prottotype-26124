"""
ROADWISE AI — Prototype Showcase Evidence Image Generator
Smart India Hackathon (SIH26124)

Generates authentic, high-definition raw and forensic Edge-AI annotated evidence
images for all 12 incident sub-types across Hyderabad and Pune transit corridors.
"""

import os
import cv2
import numpy as np
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent
UPLOADS_DIR = BACKEND_DIR / "data" / "uploads"
VIDEOS_DIR = BACKEND_DIR / "data" / "videos"
SAMPLE_FRAMES_DIR = BACKEND_DIR / "data" / "sample_frames"

UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

# Helper: Draw stylized corner brackets
def draw_targeting_brackets(img, pt1, pt2, color, thickness=2, length=18):
    x1, y1 = pt1
    x2, y2 = pt2
    # Top-Left
    cv2.line(img, (x1, y1), (x1 + length, y1), color, thickness, cv2.LINE_AA)
    cv2.line(img, (x1, y1), (x1, y1 + length), color, thickness, cv2.LINE_AA)
    # Top-Right
    cv2.line(img, (x2, y1), (x2 - length, y1), color, thickness, cv2.LINE_AA)
    cv2.line(img, (x2, y1), (x2, y1 + length), color, thickness, cv2.LINE_AA)
    # Bottom-Left
    cv2.line(img, (x1, y2), (x1 + length, y2), color, thickness, cv2.LINE_AA)
    cv2.line(img, (x1, y2), (x1, y2 - length), color, thickness, cv2.LINE_AA)
    # Bottom-Right
    cv2.line(img, (x2, y2), (x2 - length, y2), color, thickness, cv2.LINE_AA)
    cv2.line(img, (x2, y2), (x2, y2 - length), color, thickness, cv2.LINE_AA)

# Helper: Draw top-left Edge-AI HUD telemetry strip
def draw_edge_hud_banner(img, bus_id="BUS-104", cam_id="CAM-1-FRONT", gps="17.4435 N, 78.3772 E", speed="34 km/h"):
    overlay = img.copy()
    bw, bh = 540, 68
    cv2.rectangle(overlay, (16, 16), (16 + bw, 16 + bh), (15, 23, 42), -1)
    cv2.addWeighted(overlay, 0.85, img, 0.15, 0, img)
    cv2.rectangle(img, (16, 16), (16 + bw, 16 + bh), (59, 130, 246), 1, cv2.LINE_AA)

    cv2.putText(img, f"URBANEDGE AI FLEET NODE | {bus_id} ({cam_id})", (28, 38),
                cv2.FONT_HERSHEY_SIMPLEX, 0.52, (255, 255, 255), 2, cv2.LINE_AA)
    cv2.putText(img, f"GPS: {gps} | SPEED: {speed} | EDGE STATUS: ONLINE", (28, 58),
                cv2.FONT_HERSHEY_SIMPLEX, 0.40, (148, 163, 184), 1, cv2.LINE_AA)
    cv2.putText(img, "NEURAL INFERENCE: ACTIVE | MODEL: YOLO26m-EDGE", (28, 74),
                cv2.FONT_HERSHEY_SIMPLEX, 0.38, (56, 189, 248), 1, cv2.LINE_AA)

# Helper: Draw raw timestamp watermark in bottom right
def draw_raw_watermark(img, timestamp="2026-09-08 14:32:18 IST"):
    h, w = img.shape[:2]
    overlay = img.copy()
    text = f"BUS CAM HD | {timestamp} | TS-09-UB-101"
    (tw, th), _ = cv2.getTextSize(text, cv2.FONT_HERSHEY_SIMPLEX, 0.45, 1)
    cv2.rectangle(overlay, (w - tw - 24, h - 34), (w - 12, h - 12), (0, 0, 0), -1)
    cv2.addWeighted(overlay, 0.65, img, 0.35, 0, img)
    cv2.putText(img, text, (w - tw - 18, h - 18), cv2.FONT_HERSHEY_SIMPLEX, 0.42, (220, 220, 220), 1, cv2.LINE_AA)

def get_base_frame(source_type="pothole", frame_idx=0):
    """Retrieve base HD frame from real videos or sample frames"""
    if source_type in ["pothole", "crack", "divider", "garbage", "zebra"]:
        p = SAMPLE_FRAMES_DIR / f"sus_potholes_frame_0{max(1, (frame_idx % 8) + 1)}.jpg"
        if p.exists():
            img = cv2.imread(str(p))
            if img is not None:
                return cv2.resize(img, (1280, 720))
    elif source_type in ["monsoon", "water_logging"]:
        p = SAMPLE_FRAMES_DIR / f"pune_monsoon_frame_0{max(1, (frame_idx % 8) + 1)}.jpg"
        if p.exists():
            img = cv2.imread(str(p))
            if img is not None:
                return cv2.resize(img, (1280, 720))
    elif source_type in ["traffic", "congestion", "two_wheeler", "anpr"]:
        v_path = VIDEOS_DIR / "traffic_jam.mp4"
        if v_path.exists():
            cap = cv2.VideoCapture(str(v_path))
            total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT)) or 1000
            target_f = int((frame_idx * 1500 + 4000) % total)
            cap.set(cv2.CAP_PROP_POS_FRAMES, target_f)
            ret, frame = cap.read()
            cap.release()
            if ret and frame is not None:
                return cv2.resize(frame, (1280, 720))

    # Fallback: create realistic road surface canvas
    canvas = np.zeros((720, 1280, 3), dtype=np.uint8)
    canvas[:] = (55, 60, 65) # asphalt grey
    cv2.line(canvas, (640, 320), (100, 720), (200, 200, 200), 4) # lane line
    cv2.line(canvas, (640, 320), (1180, 720), (200, 200, 200), 4)
    return canvas

def generate_all_prototype_evidence():
    print("[PROTOTYPE] Generating authentic raw and forensic annotated images for all 12 incident channels...")

    evidence_configs = [
        # 1. Standard Pothole (Moderate)
        {
            "name": "sample_pothole.jpg",
            "source": "pothole",
            "frame_idx": 1,
            "bus": "HYD-101",
            "gps": "17.4475 N, 78.3815 E",
            "box": [480, 460, 790, 610],
            "type_color": (0, 0, 235), # Red
            "title": "POTHOLE 94% [HIGH PRIORITY]",
            "sub": "DEPTH: ~5.8 cm | AREA: 0.42 m2 | ACTION: 48h Mechanical Jet-Patch",
            "heatmap": True,
            "heat_color": (0, 0, 220)
        },
        # 2. Critical Emergency Pothole (Deep crater)
        {
            "name": "sample_pothole_critical.jpg",
            "source": "pothole",
            "frame_idx": 4,
            "bus": "HYD-101",
            "gps": "17.4505 N, 78.3808 E",
            "box": [380, 440, 840, 640],
            "type_color": (0, 0, 245),
            "title": "POTHOLE 97% [P0 CRITICAL EMERGENCY - CLASS I]",
            "sub": "DEPTH: ~7.8 cm | AREA: 0.68 m2 | ACTION: Immediate 24h PWD Cold-Mix Patch",
            "heatmap": True,
            "heat_color": (0, 0, 245)
        },
        # 3. Monsoon Pothole (Wet Asphalt / Muddy Cavity)
        {
            "name": "sample_monsoon_pothole.jpg",
            "source": "monsoon",
            "frame_idx": 2,
            "bus": "HYD-204",
            "gps": "17.4040 N, 78.4550 E",
            "box": [360, 450, 780, 620],
            "type_color": (235, 160, 0), # Cyan-amber
            "title": "MONSOON CAVITY 92% [P1 HIGH · RAIN REFLECTION VERIFIED]",
            "sub": "DEPTH: ~6.2 cm | AREA: 0.54 m2 | ACTION: Bitumen Seal Post-Monsoon",
            "heatmap": True,
            "heat_color": (235, 140, 0)
        },
        # 4. Water Logging / Flooded Street Puddle
        {
            "name": "sample_water_logging.jpg",
            "source": "monsoon",
            "frame_idx": 5,
            "bus": "BUS-218",
            "gps": "18.5284 N, 73.8740 E",
            "box": [280, 480, 960, 680],
            "type_color": (240, 200, 0), # Bright Cyan
            "title": "WATER LOGGING 95% [P1 HIGH · MONSOON SUBMERSION]",
            "sub": "PUDDLE DEPTH: ~8.5 cm | FLOOD RISK: SEVERE | ACTION: Clear Stormwater Drain",
            "heatmap": True,
            "heat_color": (240, 180, 0)
        },
        # 5. Missing Median Divider / Crash Barrier Defect
        {
            "name": "sample_missing_divider.jpg",
            "source": "divider",
            "frame_idx": 6,
            "bus": "BUS-104",
            "gps": "18.5380 N, 73.7850 E",
            "box": [110, 360, 360, 620],
            "type_color": (0, 140, 255), # Amber-Orange
            "title": "MISSING MEDIAN DIVIDER 89% [P1 HIGH SAFETY RISK]",
            "sub": "DEFECT: 14.2m Missing Concrete Barrier | RISK: Head-On Collision Hazard",
            "heatmap": False
        },
        # 6. Fatigue & Crocodile Road Cracks
        {
            "name": "sample_road_crack.jpg",
            "source": "crack",
            "frame_idx": 3,
            "bus": "HYD-101",
            "gps": "17.4430 N, 78.3820 E",
            "box": [320, 480, 880, 650],
            "type_color": (50, 180, 255),
            "title": "ROAD CRACK 91% [LONGITUDINAL FATIGUE DEFORMATION]",
            "sub": "CRACK LENGTH: 8.4m | WIDTH: 14mm | ACTION: Micro-Surfacing & Crack Pouring",
            "heatmap": False
        },
        # 7. Roadside Garbage / Waste Accumulation
        {
            "name": "sample_garbage.jpg",
            "source": "garbage",
            "frame_idx": 7,
            "bus": "HYD-305",
            "gps": "17.3616 N, 78.4747 E",
            "box": [820, 460, 1180, 640],
            "type_color": (100, 200, 50), # Lime Green
            "title": "ROADSIDE SOLID WASTE 88% [MUNICIPAL CLEARANCE QUEUE]",
            "sub": "EST. VOLUME: ~2.4 m3 Debris | ENCROACHING SHOULDER | ACTION: GHMC Sanitation",
            "heatmap": False
        },
        # 8. Faded Zebra Pedestrian Crossing
        {
            "name": "sample_zebra_fading.jpg",
            "source": "zebra",
            "frame_idx": 0,
            "bus": "BUS-104",
            "gps": "18.5580 N, 73.7675 E",
            "box": [240, 510, 1020, 680],
            "type_color": (255, 180, 50),
            "title": "ZEBRA CROSSING FADED 87% [RETROREFLECTIVITY LOSS]",
            "sub": "VISIBILITY: 22% Baseline | RE-PAINT: High-Build Thermoplastic Line Paint",
            "heatmap": False
        },
        # 9. Severe Traffic Congestion / Gridlock
        {
            "name": "sample_congestion.jpg",
            "source": "congestion",
            "frame_idx": 8,
            "bus": "BUS-301",
            "gps": "18.4780 N, 73.8340 E",
            "box": [160, 310, 1120, 660],
            "type_color": (0, 80, 255), # Red-Orange
            "title": "TRAFFIC CHOKEPOINT 96% [HIGH DENSITY GRIDLOCK]",
            "sub": "VEHICLES TRACKED: 24 | FLOW SPEED: 9 km/h | QUEUE: 420m Bottleneck",
            "heatmap": False
        },
        # 10. Vehicle Density Spike
        {
            "name": "sample_vehicle_density.jpg",
            "source": "traffic",
            "frame_idx": 12,
            "bus": "BUS-301",
            "gps": "18.4480 N, 73.8640 E",
            "box": [200, 320, 1080, 640],
            "type_color": (0, 170, 245),
            "title": "VEHICLE DENSITY SPIKE [HIGH CAPACITY CORRIDOR]",
            "sub": "HOURLY VOLUME: 1,840 PCU/hr | CAPACITY UTILIZATION: 94.2%",
            "heatmap": False
        },
        # 11. Two-Wheeler Safety Violations (Tripling / No Helmet)
        {
            "name": "sample_two_wheeler.jpg",
            "source": "two_wheeler",
            "frame_idx": 15,
            "bus": "HYD-305",
            "gps": "17.3710 N, 78.4850 E",
            "box": [480, 320, 780, 620],
            "type_color": (0, 60, 255),
            "title": "SAFETY VIOLATION 94% [OVERLOADED TWO-WHEELER · TRIPLING]",
            "sub": "3 RIDERS DETECTED | NO HELMET: 2 RIDERS | ACTION: E-Challan Section 128 MVA",
            "heatmap": False
        },
        # 12. ANPR Watchlist Vehicle Hit (Stolen / Police Warrant)
        {
            "name": "sample_anpr_watchlist.jpg",
            "source": "anpr",
            "frame_idx": 18,
            "bus": "HYD-101",
            "gps": "17.4505 N, 78.3808 E",
            "box": [420, 340, 820, 620],
            "type_color": (0, 0, 255),
            "title": "ANPR WATCHLIST HIT 98.4% [P0 URGENT POLICE INTERCEPT]",
            "sub": "PLATE: TS-09-EA-4412 | REASON: STOLEN VEHICLE (FIR #884/2026 Madhapur PS)",
            "heatmap": False
        }
    ]

    for cfg in evidence_configs:
        fname = cfg["name"]
        raw_fname = f"raw_{fname}"
        ann_fname = f"ann_{fname}"

        # 1. Base HD Frame
        base_img = get_base_frame(cfg["source"], cfg["frame_idx"])
        raw_img = base_img.copy()
        draw_raw_watermark(raw_img)

        # 2. Annotated Forensic Edge-AI Frame
        ann_img = base_img.copy()

        # Road surface wireframe mesh (translucent polygon)
        road_poly = np.array([[380, 280], [900, 280], [1240, 700], [40, 700]], dtype=np.int32)
        poly_overlay = ann_img.copy()
        cv2.fillPoly(poly_overlay, [road_poly], (240, 180, 0))
        cv2.addWeighted(poly_overlay, 0.08, ann_img, 0.92, 0, ann_img)
        cv2.polylines(ann_img, [road_poly], True, (240, 180, 0), 1, cv2.LINE_AA)

        # Thermal pseudo-depth cavity heatmap if requested
        x1, y1, x2, y2 = cfg["box"]
        if cfg.get("heatmap", False):
            heat_overlay = ann_img.copy()
            cx, cy = int((x1 + x2) / 2), int((y1 + y2) / 2)
            rx, ry = int((x2 - x1) / 2), int((y2 - y1) / 2)
            cv2.ellipse(heat_overlay, (cx, cy), (rx, ry), 0, 0, 360, cfg.get("heat_color", (0, 0, 220)), -1)
            cv2.addWeighted(heat_overlay, 0.38, ann_img, 0.62, 0, ann_img)

        # Bounding box & targeting brackets
        box_color = cfg["type_color"]
        cv2.rectangle(ann_img, (x1, y1), (x2, y2), box_color, 2, cv2.LINE_AA)
        draw_targeting_brackets(ann_img, (x1, y1), (x2, y2), box_color, thickness=3, length=24)

        # Centroid target crosshair dot
        cx, cy = int((x1 + x2) / 2), int((y1 + y2) / 2)
        cv2.circle(ann_img, (cx, cy), 6, box_color, -1, cv2.LINE_AA)
        cv2.circle(ann_img, (cx, cy), 12, (255, 255, 255), 1, cv2.LINE_AA)

        # Header Pill Badge
        title_text = cfg["title"]
        (tw, th), _ = cv2.getTextSize(title_text, cv2.FONT_HERSHEY_SIMPLEX, 0.52, 2)
        pill_y1 = max(y1 - 32, 12)
        cv2.rectangle(ann_img, (x1, pill_y1), (x1 + tw + 18, pill_y1 + 28), box_color, -1)
        cv2.putText(ann_img, title_text, (x1 + 9, pill_y1 + 20),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.50, (255, 255, 255), 2, cv2.LINE_AA)

        # Dimension / Sub-pill Badge (Below Box)
        sub_text = cfg["sub"]
        (stw, sth), _ = cv2.getTextSize(sub_text, cv2.FONT_HERSHEY_SIMPLEX, 0.40, 1)
        sub_y1 = min(y2 + 4, 680)
        cv2.rectangle(ann_img, (x1, sub_y1), (x1 + stw + 16, sub_y1 + 24), (15, 23, 42), -1)
        cv2.rectangle(ann_img, (x1, sub_y1), (x1 + stw + 16, sub_y1 + 24), box_color, 1)
        cv2.putText(ann_img, sub_text, (x1 + 8, sub_y1 + 17),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.40, (255, 255, 255), 1, cv2.LINE_AA)

        # Draw Top-Left HUD Banner
        draw_edge_hud_banner(ann_img, bus_id=cfg["bus"], gps=cfg["gps"])

        # Save files to UPLOADS_DIR
        raw_path = UPLOADS_DIR / raw_fname
        ann_path = UPLOADS_DIR / ann_fname
        default_path = UPLOADS_DIR / fname

        cv2.imwrite(str(raw_path), raw_img, [cv2.IMWRITE_JPEG_QUALITY, 90])
        cv2.imwrite(str(ann_path), ann_img, [cv2.IMWRITE_JPEG_QUALITY, 90])
        cv2.imwrite(str(default_path), ann_img, [cv2.IMWRITE_JPEG_QUALITY, 90])
        print(f"  [OK] Generated {fname} (Raw: {raw_fname}, Ann: {ann_fname})")

    print("\n[PROTOTYPE] All 12 prototype showcase evidence image pairs generated successfully in uploads directory!")

if __name__ == "__main__":
    generate_all_prototype_evidence()
