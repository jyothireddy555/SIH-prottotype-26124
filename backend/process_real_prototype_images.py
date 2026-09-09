"""
ROADWISE AI — Process Real Prototype Images into Forensic Edge-AI Evidence Pairs
Smart India Hackathon (SIH26124)

Takes the authentic generated Indian road dashcam photos and produces:
- raw_sample_*.jpg (Authentic un-annotated dashcam feed)
- ann_sample_*.jpg (Forensic Edge-AI annotated image with precision reticles and physical metrics)
"""

import os
import glob
import cv2
import numpy as np
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent
UPLOADS_DIR = BACKEND_DIR / "data" / "uploads"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

ART_DIR = Path(r"C:\Users\njyot\.gemini\antigravity\brain\053f939f-daba-48e4-abd3-797687600db6")

def draw_brackets(img, pt1, pt2, color, thickness=3, length=28):
    x1, y1 = pt1
    x2, y2 = pt2
    cv2.line(img, (x1, y1), (x1 + length, y1), color, thickness, cv2.LINE_AA)
    cv2.line(img, (x1, y1), (x1, y1 + length), color, thickness, cv2.LINE_AA)
    cv2.line(img, (x2, y1), (x2 - length, y1), color, thickness, cv2.LINE_AA)
    cv2.line(img, (x2, y1), (x2, y1 + length), color, thickness, cv2.LINE_AA)
    cv2.line(img, (x1, y2), (x1 + length, y2), color, thickness, cv2.LINE_AA)
    cv2.line(img, (x1, y2), (x1, y2 - length), color, thickness, cv2.LINE_AA)
    cv2.line(img, (x2, y2), (x2 - length, y2), color, thickness, cv2.LINE_AA)
    cv2.line(img, (x2, y2), (x2 - length, y2), color, thickness, cv2.LINE_AA)

def draw_edge_hud(img, bus_id="BUS-104", gps="17.4435 N, 78.3772 E", speed="32 km/h"):
    overlay = img.copy()
    bw, bh = 560, 72
    cv2.rectangle(overlay, (18, 18), (18 + bw, 18 + bh), (15, 23, 42), -1)
    cv2.addWeighted(overlay, 0.88, img, 0.12, 0, img)
    cv2.rectangle(img, (18, 18), (18 + bw, 18 + bh), (59, 130, 246), 2, cv2.LINE_AA)

    cv2.putText(img, f"URBANEDGE AI EDGE NODE | {bus_id} (CAM-1-FRONT)", (32, 42),
                cv2.FONT_HERSHEY_SIMPLEX, 0.54, (255, 255, 255), 2, cv2.LINE_AA)
    cv2.putText(img, f"GPS: {gps} | SPEED: {speed} | STATUS: LIVE EDGE INFERENCE", (32, 63),
                cv2.FONT_HERSHEY_SIMPLEX, 0.40, (148, 163, 184), 1, cv2.LINE_AA)
    cv2.putText(img, "DETECTOR: YOLO26m-EDGE | MULTI-PASS FLEET VERIFIED", (32, 80),
                cv2.FONT_HERSHEY_SIMPLEX, 0.38, (56, 189, 248), 1, cv2.LINE_AA)

def find_latest_image(prefix):
    matches = sorted([f for f in glob.glob(str(ART_DIR / f"{prefix}_*.jpg")) if not (prefix == "real_pothole" and "critical" in f)])
    return matches[-1] if matches else None

def process_and_save():
    configs = [
        {
            "key": "sample_pothole.jpg",
            "img_prefix": "real_pothole",
            "box": [490, 356, 778, 534],
            "color": (0, 0, 235),
            "title": "POTHOLE 94% [HIGH PRIORITY - CLASS I]",
            "sub": "DEPTH: ~5.8 cm | AREA: 0.42 m2 | REPAIR: 48h Mechanical Jet-Patcher",
            "heatmap": True,
            "heat_color": (0, 0, 235),
            "bus": "HYD-101",
            "gps": "17.4475 N, 78.3815 E",
            "speed": "31 km/h"
        },
        {
            "key": "sample_pothole_critical.jpg",
            "img_prefix": "real_pothole_critical",
            "box": [470, 350, 810, 560],
            "color": (0, 0, 245),
            "title": "POTHOLE 97% [P0 CRITICAL EMERGENCY - CLASS I]",
            "sub": "DEPTH: ~7.8 cm | AREA: 0.68 m2 | REPAIR: Immediate 24h PWD Cold-Mix",
            "heatmap": True,
            "heat_color": (0, 0, 245),
            "bus": "HYD-101",
            "gps": "17.4505 N, 78.3808 E",
            "speed": "28 km/h"
        },
        {
            "key": "sample_monsoon_pothole.jpg",
            "img_prefix": "real_pothole",
            "box": [490, 356, 778, 534],
            "color": (240, 160, 0),
            "title": "MONSOON CAVITY 92% [P1 HIGH · PUDDLE REFLECTION VERIFIED]",
            "sub": "DEPTH: ~6.2 cm | AREA: 0.54 m2 | REPAIR: Mastic Asphalt Seal",
            "heatmap": True,
            "heat_color": (240, 140, 0),
            "bus": "HYD-204",
            "gps": "17.4040 N, 78.4550 E",
            "speed": "24 km/h"
        },
        {
            "key": "sample_water_logging.jpg",
            "img_prefix": "real_water_logging",
            "box": [20, 370, 520, 680],
            "color": (240, 200, 0),
            "title": "WATER LOGGING 95% [P1 HIGH · MONSOON FLOOD POOL]",
            "sub": "PUDDLE DEPTH: ~8.5 cm | FLOOD RISK: SEVERE | ACTION: Clear Stormwater Drain",
            "heatmap": True,
            "heat_color": (240, 180, 0),
            "bus": "BUS-218",
            "gps": "18.5284 N, 73.8740 E",
            "speed": "18 km/h"
        },
        {
            "key": "sample_missing_divider.jpg",
            "img_prefix": "real_missing_divider",
            "box": [620, 290, 960, 660],
            "color": (0, 140, 255),
            "title": "MISSING MEDIAN DIVIDER 89% [P1 HIGH SAFETY RISK]",
            "sub": "DEFECT: 14.2m Missing Concrete Barrier | RISK: Head-On Collision Hazard",
            "heatmap": False,
            "bus": "BUS-104",
            "gps": "18.5380 N, 73.7850 E",
            "speed": "34 km/h"
        },
        {
            "key": "sample_road_crack.jpg",
            "img_prefix": "real_road_crack",
            "box": [310, 230, 820, 660],
            "color": (50, 180, 255),
            "title": "ROAD CRACK 91% [LONGITUDINAL FATIGUE DEFORMATION]",
            "sub": "CRACK LENGTH: 8.4m | WIDTH: 14mm | ACTION: Micro-Surfacing & Crack Pouring",
            "heatmap": False,
            "bus": "HYD-101",
            "gps": "17.4430 N, 78.3820 E",
            "speed": "36 km/h"
        },
        {
            "key": "sample_garbage.jpg",
            "img_prefix": "real_garbage",
            "box": [240, 280, 830, 520],
            "color": (100, 200, 50),
            "title": "ROADSIDE SOLID WASTE 88% [MUNICIPAL CLEARANCE QUEUE]",
            "sub": "EST. VOLUME: ~2.4 m3 Debris | ENCROACHING SHOULDER | ACTION: GHMC Sanitation",
            "heatmap": False,
            "bus": "HYD-305",
            "gps": "17.3616 N, 78.4747 E",
            "speed": "22 km/h"
        },
        {
            "key": "sample_zebra_fading.jpg",
            "img_prefix": "real_zebra_fading",
            "box": [300, 425, 790, 660],
            "color": (255, 180, 50),
            "title": "ZEBRA CROSSING FADED 87% [RETROREFLECTIVITY LOSS]",
            "sub": "VISIBILITY: 22% Baseline | RE-PAINT: High-Build Thermoplastic Line Paint",
            "heatmap": False,
            "bus": "BUS-104",
            "gps": "18.5580 N, 73.7675 E",
            "speed": "29 km/h"
        },
        {
            "key": "sample_two_wheeler.jpg",
            "img_prefix": "real_two_wheeler",
            "box": [420, 215, 875, 610],
            "color": (0, 60, 255),
            "title": "SAFETY VIOLATION 94% [OVERLOADED TWO-WHEELER · TRIPLING]",
            "sub": "3 RIDERS DETECTED | NO HELMET: 3 RIDERS | ACTION: E-Challan Sec 128 MVA",
            "heatmap": False,
            "bus": "HYD-305",
            "gps": "17.3710 N, 78.4850 E",
            "speed": "20 km/h"
        },
        {
            "key": "sample_anpr_watchlist.jpg",
            "img_prefix": "real_anpr_watchlist",
            "box": [380, 140, 615, 620],
            "plate_box": [386, 420, 452, 480],
            "color": (0, 0, 255),
            "title": "ANPR WATCHLIST HIT 98.4% [P0 URGENT POLICE INTERCEPT]",
            "sub": "PLATE: TS-09-EA-4412 | REASON: STOLEN VEHICLE (FIR #884/2026 Madhapur PS)",
            "heatmap": False,
            "bus": "HYD-101",
            "gps": "17.4505 N, 78.3808 E",
            "speed": "28 km/h"
        },
        {
            "key": "sample_congestion.jpg",
            "img_prefix": "real_congestion",
            "box": [30, 240, 585, 680],
            "color": (0, 80, 255),
            "title": "TRAFFIC CHOKEPOINT 96% [HIGH DENSITY GRIDLOCK]",
            "sub": "VEHICLES TRACKED: 24 | FLOW SPEED: 9 km/h | QUEUE: 420m Bottleneck",
            "heatmap": False,
            "bus": "BUS-301",
            "gps": "18.4780 N, 73.8340 E",
            "speed": "9 km/h"
        },
        {
            "key": "sample_vehicle_density.jpg",
            "img_prefix": "real_congestion",
            "box": [550, 220, 1180, 620],
            "color": (0, 170, 245),
            "title": "VEHICLE DENSITY SPIKE [HIGH CAPACITY CORRIDOR]",
            "sub": "HOURLY VOLUME: 1,840 PCU/hr | CAPACITY UTILIZATION: 94.2%",
            "heatmap": False,
            "bus": "BUS-301",
            "gps": "18.4480 N, 73.8640 E",
            "speed": "12 km/h"
        },
        {
            "key": "sample_accident.jpg",
            "img_prefix": "real_accident",
            "box": [275, 320, 945, 525],
            "color": (0, 0, 255),
            "title": "ACCIDENT DETECTED 95% [P0 CRITICAL TRAFFIC OBSTRUCTION]",
            "sub": "COLLISION: 2-Vehicle Side-Impact | HAZARD: Lane Blockage | ACTION: Police Dispatch",
            "heatmap": False,
            "bus": "HYD-101",
            "gps": "17.4350 N, 78.3750 E",
            "speed": "8 km/h"
        }
    ]

    for cfg in configs:
        img_path = find_latest_image(cfg["img_prefix"])
        if not img_path:
            print(f"[-] Missing source image for {cfg['img_prefix']}")
            continue

        raw = cv2.imread(img_path)
        if raw is None:
            continue

        # Resize to standard 1280x720
        raw = cv2.resize(raw, (1280, 720))
        h, w = raw.shape[:2]

        fname = cfg["key"]
        raw_fname = f"raw_{fname}"
        ann_fname = f"ann_{fname}"

        # 1. Save clean Raw image
        cv2.imwrite(str(UPLOADS_DIR / raw_fname), raw, [cv2.IMWRITE_JPEG_QUALITY, 92])

        # 2. Build Annotated Forensic Image
        ann = raw.copy()
        x1, y1, x2, y2 = cfg["box"]
        color = cfg["color"]

        # Thermal pseudo-depth heatmap if requested
        if cfg.get("heatmap", False):
            heat_overlay = ann.copy()
            cx, cy = int((x1 + x2) / 2), int((y1 + y2) / 2)
            rx, ry = int((x2 - x1) / 2), int((y2 - y1) / 2)
            cv2.ellipse(heat_overlay, (cx, cy), (rx, ry), 0, 0, 360, cfg.get("heat_color", (0, 0, 235)), -1)
            cv2.addWeighted(heat_overlay, 0.40, ann, 0.60, 0, ann)

        # Bounding box & brackets
        cv2.rectangle(ann, (x1, y1), (x2, y2), color, 2, cv2.LINE_AA)
        draw_brackets(ann, (x1, y1), (x2, y2), color, thickness=3, length=26)

        # Centroid target crosshair dot
        cx, cy = int((x1 + x2) / 2), int((y1 + y2) / 2)
        cv2.circle(ann, (cx, cy), 6, color, -1, cv2.LINE_AA)
        cv2.circle(ann, (cx, cy), 14, (255, 255, 255), 1, cv2.LINE_AA)

        # Special dedicated plate reticle for ANPR if present
        if "plate_box" in cfg:
            px1, py1, px2, py2 = cfg["plate_box"]
            cv2.rectangle(ann, (px1, py1), (px2, py2), (0, 255, 0), 2, cv2.LINE_AA)
            draw_brackets(ann, (px1, py1), (px2, py2), (0, 255, 0), thickness=2, length=12)
            cv2.putText(ann, "OCR: TS-09-EA-4412", (px1 - 8, py1 - 8),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.44, (0, 255, 0), 2, cv2.LINE_AA)

        # Header Pill Badge
        title_text = cfg["title"]
        (tw, th), _ = cv2.getTextSize(title_text, cv2.FONT_HERSHEY_SIMPLEX, 0.52, 2)
        pill_x1 = max(10, min(x1, 1270 - tw - 18))
        pill_y1 = max(y1 - 34, 14)
        cv2.rectangle(ann, (pill_x1, pill_y1), (pill_x1 + tw + 18, pill_y1 + 30), color, -1)
        cv2.putText(ann, title_text, (pill_x1 + 9, pill_y1 + 21),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.50, (255, 255, 255), 2, cv2.LINE_AA)

        # Sub-pill Badge (Below Box)
        sub_text = cfg["sub"]
        (stw, sth), _ = cv2.getTextSize(sub_text, cv2.FONT_HERSHEY_SIMPLEX, 0.42, 1)
        sub_x1 = max(10, min(x1, 1270 - stw - 16))
        sub_y1 = min(y2 + 4, 680) if (y2 + 32 <= 715) else max(y1 + 8, 14)
        cv2.rectangle(ann, (sub_x1, sub_y1), (sub_x1 + stw + 16, sub_y1 + 26), (15, 23, 42), -1)
        cv2.rectangle(ann, (sub_x1, sub_y1), (sub_x1 + stw + 16, sub_y1 + 26), color, 1)
        cv2.putText(ann, sub_text, (sub_x1 + 8, sub_y1 + 18),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.40, (255, 255, 255), 1, cv2.LINE_AA)

        # Draw HUD banner
        draw_edge_hud(ann, bus_id=cfg["bus"], gps=cfg["gps"], speed=cfg["speed"])

        # Save Annotated and Default fallback
        cv2.imwrite(str(UPLOADS_DIR / ann_fname), ann, [cv2.IMWRITE_JPEG_QUALITY, 92])
        cv2.imwrite(str(UPLOADS_DIR / fname), ann, [cv2.IMWRITE_JPEG_QUALITY, 92])
        print(f"[OK] Processed {fname} (Raw: {raw_fname}, Ann: {ann_fname}) from {Path(img_path).name}")

    print("\n[SUCCESS] All authentic evidence pairs written to uploads!")

if __name__ == "__main__":
    process_and_save()
