# 🚍 ROADWISE: Edge-AI Urban Intelligence & Road Quality Platform
### Smart India Hackathon Prototype (Problem Statement: SIH26124)
**Autonomous Mobile Edge Sensing Network Using Public Transit Bus Fleets**

---

## 📌 1. Executive Summary

Municipal corporations struggle with delayed road maintenance and reactive traffic management. Traditional survey vehicles with expensive LiDAR setups cost millions and inspect roads only once or twice a year. 

**ROADWISE** transforms ordinary public transport buses into **autonomous, roving mobile edge-AI sensor nodes**. By mounting low-cost dashcams on city buses that already traverse every major road artery daily, the system continuously analyzes video frames in real-time, detecting road defects (potholes, asphalt fractures) and assessing vehicle density. Geolocated incident telemetry is streamed directly to a centralized Municipal Command Center, enabling proactive maintenance dispatch and real-time traffic intelligence.

```
       [PUBLIC TRANSIT BUS FLEET]
    ┌──────────────────────────────┐
    │ 📹 1080p Windshield Dashcam  │
    │ 🧠 Edge-AI (YOLOv8 + CUDA)   │
    │ 🛰️ GPS & Inertial Telemetry  │
    └──────────────┬───────────────┘
                   │ Low-bandwidth JSON Telemetry + Evidence Frames
                   ▼
    ┌──────────────────────────────┐
    │  CENTRAL MUNICIPAL DASHBOARD │
    │ 🗺️ Live Leaflet City Map     │
    │ 🤖 Multi-Agent AI Network    │
    │ 📊 Road Quality Index & Queue│
    │ 👷 Municipal Dispatch Action │
    └──────────────────────────────┘
```

---

## 🏛️ 2. Problem Statement Alignment (SIH26124)

* **Autonomous Sensing**: Zero human intervention required; buses continuously collect and process frames while driving their standard routes.
* **Dual Intelligence**: Simultaneous road defect detection (potholes/cavities) and vehicular flow monitoring (multi-class vehicle counting).
* **Geospatial Precision**: Automatic geotagging with GPS coordinates, estimated cavity depth, surface area, and timestamps.
* **Municipal Actionability**: Direct triage dashboard enabling engineers to verify incidents, dispatch repair crews, and track resolution.

---

## ⚙️ 3. System Architecture & Tech Stack

### A. Edge-AI Detection Pipeline (Python / FastAPI / PyTorch / YOLOv8)
* **Object Detection Engine**: Ultralytics **YOLOv8n** running on PyTorch with CUDA acceleration (NVIDIA RTX 3050 ~4.2ms inference latency per frame).
* **Multi-Class Vehicle Classifier**: Detects `cars`, `motorcycles`, `buses`, and `trucks`, computing real-time congestion levels:
  * **Low Density**: 0–5 vehicles/frame
  * **Moderate Density**: 6–10 vehicles/frame
  * **High Density / Congestion**: 11+ vehicles/frame
* **Road Defect & Pothole Engine**:
  * **Vehicle-Overlap Suppression (IoU Filter)**: Prevents moving vehicles, tires, and under-chassis shadows from generating false-positive pothole alarms.
  * **Morphological Asphalt Cavity Analyzer**: Evaluates asphalt depression contrast, texture variance ($\sigma > 10.0$), and aspect ratios to isolate genuine potholes.
  * **Severity Scoring**: Classified into `LOW`, `MEDIUM`, `HIGH`, or `CRITICAL` based on cavity area ratio, estimated depth ($4.5\text{ cm} - 8.5\text{ cm}$), and surface area ($\text{m}^2$).
  * **HUD Watermark Overlay**: Generates legal evidence frames watermarked with GPS, speed, bus ID, timestamp, and confidence scores.

### B. Command Center Frontend (React 19, Vite, Tailwind CSS v4, Leaflet)
* **Design Language**: Antigravity Light & Spatial Design (clean off-white `#F8F9FA`, high-contrast typography, zero dark theme, Google Blue accents).
* **Synchronized Video HUD**: HTML5 dashcam video player with HUD telemetry overlay and real-time detection flash banners.
* **Synchronized Bus Movement**: Active bus marker glides along route polyline on the Leaflet map while video plays; stops immediately when video is paused.
* **Contextual Artifact Drawers**:
  * **AI Incident Drawer**: Inspects YOLO bounding box evidence, agent assessment checklist, and municipal action triggers (`Mark Verified`, `Dispatch Repair Crew`, `Mark Resolved`).
  * **Bus Fleet Drawer**: Tracks vehicle speed, camera health, and detection history.
  * **AI Agent Network Modal**: Displays the 4 autonomous micro-agents and their operational parameters.

---

## 🚌 4. Simulated Fleet & City Route Corridors

The prototype demonstrates 3 distinct buses operating on 3 independent transit corridors across Pune:

| Node ID | Route Name | Sector | Mapped Dashcam Stream | Primary AI Scenario |
| :--- | :--- | :--- | :--- | :--- |
| **`BUS-104`** | **Route 115** (Sus Road & Pashan) | **West Pune** | `bus_dashcam_feed.mp4` | 🕳️ **Severe Potholes & Broken Asphalt** |
| **`BUS-218`** | **Route 500D** (Nagar Rd & Yerawada) | **East Pune** | `pune_monsoon.mp4` | 🕳️ **Monsoon Potholes & Waterlogged Cavities** |
| **`BUS-301`** | **Route 335E** (Highway Bypass Flow) | **South Pune** | `traffic_jam.mp4` | 🚗 **High Vehicular Flow & Highway Congestion** |

---

## 🤖 5. Multi-Agent AI Network Architecture

ROADWISE utilizes four specialized autonomous micro-agents:

1. **Road Defect Agent**: Scans lower road plane, classifies defect severity, calculates estimated depth and cavity surface area.
2. **Vehicle Counting Agent**: Identifies multi-class vehicles, tracks density spikes, and monitors arterial congestion.
3. **Geospatial Telemetry Agent**: Correlates GPS waypoints with road asset IDs and updates fleet telemetry.
4. **Municipal Dispatch Agent**: Groups nearby defects into single work-orders, assigns priority based on severity, and tracks municipal resolution status.

---

## 💻 6. Hardware Feasibility & Lag-Free Edge Profile

| Component | Target Edge Bus Hardware | Prototype Benchmark (RTX 3050) |
| :--- | :--- | :--- |
| **Processor** | Quad-Core ARM Cortex / Intel x86 | Intel Core i5 13th Gen |
| **RAM** | 4 GB – 8 GB RAM | 16 GB DDR4/DDR5 |
| **GPU / NPU** | NVIDIA Jetson Orin Nano / Hailo-8 | NVIDIA GeForce RTX 3050 (6 GB VRAM) |
| **Inference Time** | $\sim 15 - 25\text{ ms}$ | **$4.2\text{ ms}$ (CUDA accelerated)** |
| **Throughput** | 15–30 FPS real-time | 60+ FPS |
| **Bandwidth** | Lightweight JSON ($< 2\text{ KB/alert}$) | Negligible network overhead |

---

## 🎤 7. Judge Pitch & Live Demo Script (2-Minute Walkthrough)

### Step 1: The Problem (0:00 - 0:30)
> *"Potholes cause thousands of accidents every monsoon, and municipal authorities only find out after citizens complain. What if the city's bus fleet—which already travels every road every single day—could continuously inspect the roads automatically?"*

### Step 2: The Command Center & Live Video Sync (0:30 - 1:00)
> *"Here is ROADWISE. On the left is the live dashcam feed from Bus 104 on Sus Road. On the right is our live city transit map. When I click **DRIVE**, watch how the bus moves on the map in sync with the video. When the video pauses, the bus stops immediately."*

### Step 3: Real-Time AI Detection & Evidence Drawer (1:00 - 1:30)
> *"As the bus drives, our onboard YOLOv8 model detects road defects and vehicles. When a pothole appears, an alert flashes on the HUD and drops a red pin on the map. Clicking the pin opens the **AI Evidence Artifact**, showing the exact bounding box, confidence score, estimated cavity depth of 6.2 cm, and GPS location."*

### Step 4: Multi-Node Switching & Municipal Action (1:30 - 2:00)
> *"We can switch nodes to **Bus 218** for monsoon waterlogged potholes, or **Bus 301** for tourist highway traffic density. Finally, municipal engineers can click **[Dispatch Repair Crew]** to initiate repair work orders directly from the dashboard."*

---

## 🛠️ 8. How to Run Locally

### 1. Prerequisites
* Python 3.10+
* Node.js 18+

### 2. Backend Setup
```bash
cd backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Open **`http://localhost:5173/`** in your browser.
