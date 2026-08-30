# 🚌 ROADWISE AI — Urban Transit Fleet Edge-AI Intelligence Platform
### Smart India Hackathon (SIH26124) Prototype

An AI-powered urban intelligence platform that transforms public transit bus fleets into roving edge-AI sensing nodes. Public buses continuously monitor road infrastructure and traffic flow, detecting road defects (potholes/cavities) and vehicular density in real-time to empower municipal command centers.

---

## 🌟 Key Highlights & Design Philosophy

- **Light-Themed Antigravity × Google Maps UX**: Designed with a clean, airy, high-density operations layout (`#F8F9FA` warm background, pure white card surfaces, subtle slate borders, Google blue accents).
- **Synchronized Live Bus Video HUD**: Dual-screen command center where real bus dashcam footage plays with live AI bounding box overlays side-by-side with the geographic map, synchronously dropping alert pins as the bus travels along transit corridors.
- **Dual Edge-AI Pipeline**:
  - **Vehicles & Traffic Flow**: Ultralytics YOLOv8 (COCO Multiclass: Cars, Buses, Trucks, Motorcycles) classifying density into *Low (0–5)*, *Moderate (6–10)*, and *High (11+)*.
  - **Road Defects & Potholes**: Specialized road damage analyzer extracting cavity contours, estimating depth (~4.5 to 8.5 cm), surface area (sq.m), and assigning severity (*LOW, MEDIUM, HIGH, CRITICAL*).
- **Antigravity Artifact Drawers**: Clicking any alert, bus, or AI agent slides out contextual evidence (annotated bounding box image, GPS timestamp, municipal verification, and maintenance crew dispatch).
- **Deterministic 2-Minute Judge Demo Mode**: Built-in 1-click live simulation with real dashcam videos and route corridors.

---

## 🚀 2-Minute Judge Pitch & Demo Walkthrough Script

| Time | Action | Presentation Narrative for Judges |
| :--- | :--- | :--- |
| **0:00 - 0:20** | Open `http://localhost:5173` | *"Good morning judges. Rather than investing crores into stationary road sensors, ROADWISE turns existing municipal bus fleets into moving AI sensing nodes. Here is our central urban intelligence command center."* |
| **0:20 - 0:45** | Click **[LIVE SIMULATION]** on Header | *"As Bus 104 drives along the Pune Transit Corridor, its onboard camera runs YOLOv8 and road defect detection locally at 30+ FPS."* |
| **0:45 - 1:10** | Watch pothole alert flash & appear on Map | *"Notice the live sync: the moment the bus camera encounters a broken road surface, the edge-AI model identifies the pothole, calculates cavity depth and confidence (94%), and instantly transmits a geolocated alert to the city map."* |
| **1:10 - 1:30** | Click on any red map marker or alert card | *"Clicking any incident opens our Antigravity-style Evidence Artifact. The municipal engineer sees the exact bounding box snapshot, GPS geotag, and can click 'Dispatch Repair Crew' with one click."* |
| **1:30 - 1:50** | Click **"Urban Analytics"** on Left Sidebar | *"The system aggregates observations from thousands of bus runs into a city-wide Road Quality Score, defect heatmaps, and identifies chronic traffic chokepoints for municipal budget planning."* |
| **1:50 - 2:00** | Click **"Test Custom Frame"** or Show **AI Agents** | *"The platform is completely modular and ready to scale across any public transit fleet."* |

---

## 🛠️ Quickstart (Run Backend & Frontend Side-by-Side)

### Prerequisites
- **Python 3.10+** (with PyTorch, OpenCV, FastAPI, Ultralytics)
- **Node.js v18+** & npm

---

### Step 1: Start the FastAPI Backend
Open a terminal in the project root:
```bash
python backend/run.py
```
* Backend starts at: `http://127.0.0.1:8000`
* Interactive Swagger API Docs: `http://127.0.0.1:8000/docs`

---

### Step 2: Start the React Frontend
Open a second terminal:
```bash
cd frontend
npm run dev
```
* Dashboard opens at: `http://localhost:5173`

---

## 📡 REST API Architecture

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/ingest` | Multipart image upload for edge-AI processing & annotation |
| `GET` | `/api/alerts` | Filterable list of alerts (`pothole`, `vehicle_density`, severity, bus ID) |
| `GET` | `/api/alerts/{id}` | Detailed incident evidence record |
| `PATCH`| `/api/alerts/{id}/action` | Update incident status (`verify`, `dispatch`, `resolve`) |
| `GET` | `/api/stats` | Aggregated analytics (Road Quality Score, defect breakdown, top corridors) |
| `GET` | `/api/fleet/buses` | Active transit buses, live coordinates, speed, and telemetry |
| `GET` | `/api/fleet/activity` | Streaming live AI agent activity log |
| `POST` | `/api/simulate/step` | Advances simulation by 1 frame along the corridor |
| `POST` | `/api/simulate/toggle-play`| Start/Pause continuous live simulation feed |
| `POST` | `/api/simulate/reset` | Resets simulation and seeds clean baseline telemetry |

---

## 📂 Project Directory Structure

```
d:/SIH/
├── backend/
│   ├── app/
│   │   ├── main.py               # FastAPI entry point & CORS configuration
│   │   ├── config.py             # Paths and constants
│   │   ├── database.py           # SQLite connection & session
│   │   ├── models.py             # Database models (Alert, Bus, ActivityLog)
│   │   ├── schemas.py            # Pydantic schemas
│   │   ├── detector.py           # Dual YOLOv8 + Pothole detection engine
│   │   ├── simulator.py          # Deterministic transit corridor simulator
│   │   └── routes/
│   │       ├── ingest.py         # POST /api/ingest
│   │       ├── alerts.py         # GET & PATCH /api/alerts
│   │       ├── stats.py          # GET /api/stats
│   │       ├── fleet.py          # GET /api/fleet
│   │       └── simulate.py       # POST /api/simulate
│   ├── data/
│   │   ├── urban_intelligence.db # SQLite database
│   │   ├── sample_frames/        # 16 extracted high-res keyframes from dashcam videos
│   │   ├── videos/               # bus_dashcam_feed.mp4 (browser stream)
│   │   └── uploads/              # Raw and annotated evidence frames
│   ├── prepare_data.py           # Video frame extractor utility
│   └── run.py                    # Server startup script
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx               # Master command center layout
│   │   ├── api.js                # Axios REST client
│   │   ├── components/
│   │   │   ├── Header.jsx        # Top bar with live simulation controller
│   │   │   ├── Sidebar.jsx       # Left navigation & road quality score
│   │   │   ├── LiveMap.jsx       # Leaflet map with Positron light tiles
│   │   │   ├── BusVideoHUD.jsx   # Onboard dashcam HUD player
│   │   │   ├── ActivityTicker.jsx# Real-time streaming AI activity
│   │   │   ├── IncidentDrawer.jsx# Evidence artifact slideout
│   │   │   ├── BusDetailDrawer.jsx# Bus telemetry inspector
│   │   │   ├── AIAgentsDrawer.jsx# Micro-agent network architecture
│   │   │   ├── AnalyticsView.jsx # Municipal road quality & charts
│   │   │   └── ManualUploadModal.jsx # Drag-and-drop test frame tester
│   │   └── styles/
│   └── package.json
│
└── README.md
```

---

## 🏆 Smart India Hackathon Alignment (SIH26124)

> *"AI detection is merely the sensor input. The true value is the centralized urban intelligence generated from roving public transport fleets."*
