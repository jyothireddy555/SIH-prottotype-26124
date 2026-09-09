"""
ROADWISE AI — Pretrained Pothole Model Benchmark & Jetson Export
Smart India Hackathon (SIH26124)

This script benchmarks the recommended models on bus road video footage:
  Model A: mfranzon/pothole-yolo26 (YOLO26m, 21.77M params, fine-tuned on dashcam/street imagery)
  Model B: Samdutse/pothole-yolov8 (YOLOv8s, 11.14M params, Smartathon/Roboflow)

Usage:
  python backend/benchmark_pothole_models.py --model yolo26 --video backend/data/videos/bus_dashcam_feed.mp4
  python backend/benchmark_pothole_models.py --model samdutse --video backend/data/videos/bus_dashcam_feed.mp4
  python backend/benchmark_pothole_models.py --export tensorrt --model yolo26
"""

import argparse
import time
import cv2
import torch
from pathlib import Path
from ultralytics import YOLO

WEIGHTS_DIR = Path(__file__).resolve().parent / "weights"
VIDEOS_DIR = Path(__file__).resolve().parent / "data" / "videos"

MODELS = {
    "yolo26": {
        "name": "mfranzon/pothole-yolo26",
        "weights": WEIGHTS_DIR / "pothole_yolo26.pt",
        "repo_id": "mfranzon/pothole-yolo26",
        "filename": "best.pt",
        "params": "21.77M",
        "description": "Fine-tuned specifically for potholes from dashcam and street-level footage"
    },
    "samdutse": {
        "name": "Samdutse/pothole-yolov8",
        "weights": WEIGHTS_DIR / "pothole_samdutse_yolov8.pt",
        "repo_id": "Samdutse/pothole-yolov8",
        "filename": "best.pt",
        "params": "11.14M",
        "description": "YOLOv8s trained on Smartathon/Roboflow pothole data (mAP50: 0.816)"
    }
}

def ensure_weights(model_key: str):
    info = MODELS[model_key]
    weights_path = info["weights"]
    if not weights_path.exists():
        print(f"[*] Downloading {info['name']} from Hugging Face...")
        from huggingface_hub import hf_hub_download
        import shutil
        downloaded = hf_hub_download(repo_id=info["repo_id"], filename=info["filename"])
        shutil.copy(downloaded, weights_path)
        print(f"[+] Saved weights to {weights_path}")
    return weights_path

def benchmark_video(model_key: str, video_path: Path, max_frames: int = 150, conf: float = 0.30):
    weights = ensure_weights(model_key)
    model = YOLO(str(weights))
    
    device = 0 if torch.cuda.is_available() else "cpu"
    print(f"\n{'='*60}")
    print(f"  Benchmarking: {MODELS[model_key]['name']} ({MODELS[model_key]['params']})")
    print(f"  Device: {device} | Video: {video_path.name}")
    print(f"{'='*60}\n")

    cap = cv2.VideoCapture(str(video_path))
    if not cap.isOpened():
        print(f"[-] Error opening video: {video_path}")
        return

    frames = 0
    potholes_detected = 0
    start = time.perf_counter()

    while True:
        ok, frame = cap.read()
        if not ok or (max_frames and frames >= max_frames):
            break

        results = model.predict(frame, imgsz=640, conf=conf, device=device, verbose=False)
        frames += 1
        if len(results) > 0 and len(results[0].boxes) > 0:
            potholes_detected += len(results[0].boxes)

        if frames % 50 == 0:
            elapsed = time.perf_counter() - start
            print(f"  Frame {frames:4d} | Potholes: {potholes_detected:3d} | Current FPS: {frames/elapsed:5.1f}")

    elapsed = time.perf_counter() - start
    cap.release()
    avg_fps = frames / elapsed if elapsed > 0 else 0
    avg_latency = (elapsed / frames) * 1000 if frames > 0 else 0

    print(f"\n{'-'*60}")
    print(f"  RESULTS FOR {MODELS[model_key]['name']}:")
    print(f"  Total Frames Evaluated : {frames}")
    print(f"  Total Potholes Detected: {potholes_detected}")
    print(f"  Average FPS            : {avg_fps:.2f} FPS")
    print(f"  Average Latency / Frame: {avg_latency:.1f} ms")
    print(f"{'-'*60}\n")

def export_model(model_key: str, format_type: str = "onnx"):
    weights = ensure_weights(model_key)
    model = YOLO(str(weights))
    print(f"[*] Exporting {MODELS[model_key]['name']} to {format_type.upper()}...")
    
    if format_type.lower() == "tensorrt":
        try:
            model.export(format="engine", half=True, dynamic=True)
            print("[+] Exported TensorRT FP16 engine successfully!")
        except Exception as e:
            print(f"[-] TensorRT requires CUDA and TensorRT: {e}")
            print("[*] Falling back to ONNX...")
            model.export(format="onnx", half=True)
    elif format_type.lower() == "onnx":
        model.export(format="onnx", dynamic=True)
        print("[+] Exported ONNX model successfully!")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--model", choices=["yolo26", "samdutse", "all"], default="yolo26")
    parser.add_argument("--video", type=str, default=str(VIDEOS_DIR / "bus_dashcam_feed.mp4"))
    parser.add_argument("--max-frames", type=int, default=150)
    parser.add_argument("--export", choices=["tensorrt", "onnx", "none"], default="none")
    args = parser.parse_args()

    if args.export != "none":
        export_model(args.model if args.model != "all" else "yolo26", args.export)
    elif args.model == "all":
        benchmark_video("yolo26", Path(args.video), args.max_frames)
        benchmark_video("samdutse", Path(args.video), args.max_frames)
    else:
        benchmark_video(args.model, Path(args.video), args.max_frames)
