import os
import cv2
import json
import numpy as np
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
BACKEND_DIR = Path(__file__).resolve().parent
SAMPLE_FRAMES_DIR = BACKEND_DIR / "data" / "sample_frames"
VIDEOS_DIR = BACKEND_DIR / "data" / "videos"

SAMPLE_FRAMES_DIR.mkdir(parents=True, exist_ok=True)
VIDEOS_DIR.mkdir(parents=True, exist_ok=True)

# Path to 3 source dashcam videos
VIDEO_1 = BASE_DIR / "Pune Road Condition Today Potholes Across the City Monsoon Dashcam (1080p).mp4"
VIDEO_2 = BASE_DIR / "Impossible for 2-Wheelers! Worst Road Near VTP Sus & KANNU KI CHAI Pune Dashcam (1080p).mp4"
VIDEO_3 = BASE_DIR / "Ye kya hal ker diya Jim corbett ka tourists ne !!!...her jagah traffic !! Ramnagar to #jimcorbett (1080p).mp4"

def extract_keyframes_and_clips():
    print("[PREPARE DATA] Extracting keyframes and generating optimized video clips...")
    
    # 1. Waypoints along Pune Transit Corridor (Route 115: Pune Station -> Yerawada -> Nagar Rd -> Viman Nagar -> Kharadi)
    corridor_waypoints = [
        {"seq": 1, "lat": 18.5284, "lng": 73.8743, "name": "Pune Station Bus Terminal", "type": "transit_start", "time_sec": 0},
        {"seq": 2, "lat": 18.5342, "lng": 73.8791, "name": "Mangaldas Road Crossing", "type": "normal", "time_sec": 3},
        {"seq": 3, "lat": 18.5411, "lng": 73.8864, "name": "Yerawada Bridge Chokepoint", "type": "traffic_dense", "time_sec": 6},
        {"seq": 4, "lat": 18.5468, "lng": 73.8927, "name": "Nagar Road - Shastrinagar Jcn", "type": "pothole_cluster", "time_sec": 9},
        {"seq": 5, "lat": 18.5512, "lng": 73.8995, "name": "Gunjan Chowk Transit Stop", "type": "normal", "time_sec": 12},
        {"seq": 6, "lat": 18.5558, "lng": 73.9064, "name": "Kalyani Nagar Flyover Ramp", "type": "pothole_severe", "time_sec": 15},
        {"seq": 7, "lat": 18.5604, "lng": 73.9142, "name": "Ramwadi Metro Station", "type": "traffic_dense", "time_sec": 18},
        {"seq": 8, "lat": 18.5649, "lng": 73.9218, "name": "Viman Nagar Main Junction", "type": "pothole_cluster", "time_sec": 21},
        {"seq": 9, "lat": 18.5692, "lng": 73.9287, "name": "Phoenix Marketcity Frontage", "type": "traffic_dense", "time_sec": 24},
        {"seq": 10, "lat": 18.5735, "lng": 73.9356, "name": "Chandan Nagar Road Defect Zone", "type": "pothole_severe", "time_sec": 27},
        {"seq": 11, "lat": 18.5778, "lng": 73.9423, "name": "Kharadi Bypass Corridor", "type": "normal", "time_sec": 30},
        {"seq": 12, "lat": 18.5821, "lng": 73.9491, "name": "EON IT Park Phase 1", "type": "traffic_moderate", "time_sec": 33},
        {"seq": 13, "lat": 18.5864, "lng": 73.9559, "name": "World Trade Center Terminal", "type": "transit_end", "time_sec": 36}
    ]

    # Save manifest
    manifest_path = BACKEND_DIR / "data" / "simulation_manifest.json"
    with open(manifest_path, "w") as f:
        json.dump(corridor_waypoints, f, indent=2)
    print(f"[PREPARE DATA] Saved simulation route manifest: {manifest_path}")

    # Extract sample keyframes from available videos
    sources = [
        (VIDEO_1, "pune_monsoon", [15, 30, 45, 60, 75, 90, 120, 150]),
        (VIDEO_2, "sus_potholes", [10, 25, 40, 55, 70, 85, 100]),
        (VIDEO_3, "traffic_jam", [20, 50, 80, 110, 140, 170])
    ]

    extracted_count = 0
    demo_frames = []

    for video_path, prefix, timestamps in sources:
        if not video_path.exists():
            print(f"[PREPARE DATA] Warning: Video file not found: {video_path}")
            continue

        cap = cv2.VideoCapture(str(video_path))
        fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
        
        for idx, sec in enumerate(timestamps):
            frame_no = int(sec * fps)
            cap.set(cv2.CAP_PROP_POS_FRAMES, frame_no)
            ret, frame = cap.read()
            if ret:
                # Resize to standard 1280x720 for crisp display
                frame_resized = cv2.resize(frame, (1280, 720))
                out_filename = f"{prefix}_frame_{idx+1:02d}.jpg"
                out_path = SAMPLE_FRAMES_DIR / out_filename
                cv2.imwrite(str(out_path), frame_resized)
                demo_frames.append(out_filename)
                extracted_count += 1
        cap.release()

    print(f"[PREPARE DATA] Extracted {extracted_count} high-resolution keyframes into {SAMPLE_FRAMES_DIR}")

    # Create optimized web-streamable MP4 clip (first 45 seconds of Video 1 or 2)
    primary_video = VIDEO_1 if VIDEO_1.exists() else (VIDEO_2 if VIDEO_2.exists() else None)
    if primary_video:
        clip_out_path = VIDEOS_DIR / "bus_dashcam_feed.mp4"
        print(f"[PREPARE DATA] Encoding browser-compatible 720p stream to {clip_out_path}...")
        
        cap = cv2.VideoCapture(str(primary_video))
        fps = int(cap.get(cv2.CAP_PROP_FPS) or 25)
        # 45 seconds clip
        max_frames = fps * 45
        
        # Use avc1 / mp4v codec
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        out = cv2.VideoWriter(str(clip_out_path), fourcc, fps, (1280, 720))
        
        frame_idx = 0
        while cap.isOpened() and frame_idx < max_frames:
            ret, frame = cap.read()
            if not ret:
                break
            frame_resized = cv2.resize(frame, (1280, 720))
            out.write(frame_resized)
            frame_idx += 1
            
        cap.release()
        out.release()
        print(f"[PREPARE DATA] Generated demo video clip: {clip_out_path} ({frame_idx} frames)")

if __name__ == "__main__":
    extract_keyframes_and_clips()
