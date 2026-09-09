import React, { useState } from 'react';
import {
  Camera,
  Play,
  Pause,
  FastForward,
  Cpu,
  MapPin,
  Activity,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  HardDrive,
  ChevronRight,
  Clock,
  Zap,
  ArrowLeft,
  Info,
  Sparkles,
  Radio,
  Filter,
  TrendingDown,
  Server,
  Layers,
  Map
} from 'lucide-react';
import BusVideoHUD from './BusVideoHUD';
import LiveMap from './LiveMap';

// Transit Corridor Waypoints for Real-Time Progression Radar
const routeWaypointsMap = {
  'HYD-101': [
    { seq: 1, name: 'Gachibowli Stadium Terminal', tag: 'Origin Terminal' },
    { seq: 2, name: 'DLF Cyber City Gateway', tag: 'IT Corridor' },
    { seq: 3, name: 'IIIT Hyderabad Crossroad', tag: 'Pothole Risk' },
    { seq: 4, name: 'Cyber Towers Rotary Chokepoint', tag: 'Critical Cavity' },
    { seq: 5, name: 'Hitec City Metro Station Node', tag: 'Traffic Queue' },
    { seq: 6, name: 'Mindspace IT Park Entrance', tag: 'Transit Node' },
    { seq: 7, name: 'Inorbit Mall Frontage Road', tag: 'Heavy Flow' },
    { seq: 8, name: 'Durgam Cheruvu Cable Bridge', tag: 'Severe Cavity' },
    { seq: 9, name: 'Knowledge City Expressway', tag: 'Expressway' },
    { seq: 10, name: 'Bio-Diversity Park Flyover', tag: 'Flyover Ramp' },
    { seq: 11, name: 'Waverock Financial District', tag: 'Dense Corridor' },
    { seq: 12, name: 'Wipro Circle Terminal Node', tag: 'Terminus' }
  ],
  'HYD-204': [
    { seq: 1, name: 'Mehdipatnam Rythu Bazar Terminal', tag: 'Origin Terminal' },
    { seq: 2, name: 'Sarojini Devi Eye Hospital', tag: 'Transit Stop' },
    { seq: 3, name: 'Masab Tank Flyover Ramp', tag: 'Monsoon Cavity' },
    { seq: 4, name: 'Lakdikapul Metro Transit', tag: 'Metro Node' },
    { seq: 5, name: 'Khairatabad RTA Junction', tag: 'Junction' },
    { seq: 6, name: 'Tank Bund Promenade Frontage', tag: 'Monsoon Cavity' },
    { seq: 7, name: 'Ranigunj Chokepoint', tag: 'Traffic Queue' },
    { seq: 8, name: 'Secunderabad Station Terminal', tag: 'Terminus' }
  ],
  'HYD-305': [
    { seq: 1, name: 'Charminar Heritage Node', tag: 'Origin Terminal' },
    { seq: 2, name: 'Madina Building Corridor', tag: 'Dense Pedestrian' },
    { seq: 3, name: 'Koti Women\'s College Transit', tag: 'Traffic Jam' },
    { seq: 4, name: 'Chaderghat Rotary Node', tag: 'Rotary' },
    { seq: 5, name: 'Dilsukhnagar Metro Chokepoint', tag: 'Heavy Jam' },
    { seq: 6, name: 'LB Nagar Ring Road Terminal', tag: 'Terminus' }
  ],
  'BUS-104': [
    { seq: 1, name: 'Sus Gaon Bus Stand', tag: 'Origin Terminal' },
    { seq: 2, name: 'Sus Hospital Crossroad', tag: 'Transit Stop' },
    { seq: 3, name: 'VTP Urban Life Junction', tag: 'Moderate Defect' },
    { seq: 4, name: 'KANNU KI CHAI Jcn (Broken Asphalt)', tag: 'Critical Pothole' },
    { seq: 5, name: 'Pashan-Sus Link Road', tag: 'Severe Cavity' },
    { seq: 6, name: 'Pashan Circle Transit Stop', tag: 'Transit Stop' },
    { seq: 7, name: 'Abhinav Highway Overpass', tag: 'Highway Ramp' },
    { seq: 8, name: 'Baner-Sus Connecting Road', tag: 'Connecting Road' },
    { seq: 9, name: 'Radha Chowk Flyover Approach', tag: 'Flyover' },
    { seq: 10, name: 'Hinjewadi Phase 1 Wipro Circle', tag: 'Terminus' }
  ],
  'BUS-218': [
    { seq: 1, name: 'Pune Station Bus Terminal', tag: 'Origin Terminal' },
    { seq: 2, name: 'Sassoon Hospital Crossroad', tag: 'Transit Stop' },
    { seq: 3, name: 'Bund Garden Approach Bridge', tag: 'River Bridge' },
    { seq: 4, name: 'Yerawada Bridge Chokepoint', tag: 'Dense Traffic' },
    { seq: 5, name: 'Nagar Road - Shastrinagar Jcn', tag: 'Monsoon Cavity' },
    { seq: 6, name: 'Kalyani Nagar Flyover Ramp', tag: 'Severe Cavity' },
    { seq: 7, name: 'Ramwadi Metro Station', tag: 'Metro Node' },
    { seq: 8, name: 'Viman Nagar Main Junction', tag: 'Monsoon Defect' },
    { seq: 9, name: 'Phoenix Marketcity Frontage', tag: 'Traffic Dense' },
    { seq: 10, name: 'EON Free Zone Phase 1 Terminal', tag: 'Terminus' }
  ],
  'BUS-301': [
    { seq: 1, name: 'Katraj Tunnel Highway Toll Gate', tag: 'Origin Terminal' },
    { seq: 2, name: 'Katraj Dairy Highway Ramp', tag: 'Highway Ramp' },
    { seq: 3, name: 'NH-48 New Expressway Corridor', tag: 'Expressway' },
    { seq: 4, name: 'Ambegaon Budruk Flyover', tag: 'Flyover' },
    { seq: 5, name: 'D-Mart Ambegaon Highway Node', tag: 'Traffic Jam' },
    { seq: 6, name: 'Navale Bridge Expressway Junction', tag: 'Heavy Jam' },
    { seq: 7, name: 'Vadgaon Budruk Flyover', tag: 'Queue' },
    { seq: 8, name: 'Warje Flyover Approach', tag: 'Flyover' },
    { seq: 9, name: 'Chandani Chowk Highway Ramp', tag: 'Chokepoint' },
    { seq: 10, name: 'Highway Terminal North', tag: 'Terminus' }
  ]
};

class HudErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("HUD Error Boundary caught error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full min-h-[360px] bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center rounded-2xl">
          <div className="p-3 bg-red-500/20 text-red-400 rounded-2xl mb-3 border border-red-500/30">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-100">Live Video Stream Recovered</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-md">
            The HUD renderer encountered an unexpected state. You can reload the camera feed safely without restarting the application.
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow cursor-pointer transition-all"
          >
            Reload Stream & HUD
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function SimulationView({
  activeCity = 'hyderabad',
  activeBus = null,
  activeBusId = 'HYD-101',
  buses = [],
  activeCamera = 'CAM-1-FRONT',
  isPlaying = false,
  speed = '1x',
  latestDetection = null,
  systemInfo = null,
  alerts = [],
  videoProgress = 0,
  onTogglePlay = () => {},
  onStep = () => {},
  onChangeSpeed = () => {},
  onSelectBus = () => {},
  onSelectCamera = () => {},
  onVideoProgress = () => {},
  onSendLiveFrame = () => {},
  onInspectIncident = () => {},
  onReturnToCommand = () => {}
}) {
  const [selectedSubTab, setSelectedSubTab] = useState('detections'); // 'detections' | 'radar' | 'telemetry'
  const [showExplainerGuide, setShowExplainerGuide] = useState(false);
  const [severityFilter, setSeverityFilter] = useState('ALL');

  const currentBusKey = activeBus?.bus_label || activeBusId || (activeCity === 'hyderabad' ? 'HYD-101' : 'BUS-104');

  // Friendly Bus List
  const cityBuses =
    activeCity === 'hyderabad'
      ? [
          { id: 'HYD-101', route: 'Route 216', name: 'Hitec City / Financial Dist', driver: 'R. Sharma' },
          { id: 'HYD-204', route: 'Route 10H', name: 'Secunderabad / Begumpet', driver: 'M. Ali' },
          { id: 'HYD-305', route: 'Route 5K', name: 'Charminar Express', driver: 'K. Reddy' }
        ]
      : [
          { id: 'BUS-104', route: 'Route 115', name: 'Sus Road / Hinjewadi', driver: 'S. Patil' },
          { id: 'BUS-218', route: 'Route 500D', name: 'Monsoon City Corridors', driver: 'A. Joshi' },
          { id: 'BUS-301', route: 'Route 335E', name: 'Highway Traffic Flow', driver: 'P. Shinde' }
        ];

  // Friendly Camera List
  const cameraAngles = [
    { id: 'CAM-1-FRONT', label: 'Front Road Camera', subtitle: 'Potholes & Cavities', icon: '🛣️' },
    { id: 'CAM-2-SIDE', label: 'Left Curb Camera', subtitle: 'Sidewalk & Garbage', icon: '🚶' },
    { id: 'CAM-3-REAR', label: 'Rear Camera', subtitle: 'Traffic Flow & Queues', icon: '🚦' }
  ];

  // Filter alerts to active city
  const cityAlerts = alerts.filter(
    (a) => !a.city_id || a.city_id.toLowerCase() === activeCity.toLowerCase()
  );

  const filteredAlerts = cityAlerts.filter((a) => {
    if (severityFilter === 'ALL') return true;
    if (severityFilter === 'CRITICAL') return a.priority_level === 'P0' || a.severity === 'CRITICAL';
    if (severityFilter === 'HIGH') return a.priority_level === 'P1' || a.severity === 'HIGH';
    return true;
  });

  // Waypoints for active bus
  const activeWaypoints = routeWaypointsMap[currentBusKey] || routeWaypointsMap['HYD-101'];
  const currentWpIndex = Math.min(
    Math.floor((videoProgress || 0) * activeWaypoints.length),
    activeWaypoints.length - 1
  );
  const currentWaypoint = activeWaypoints[currentWpIndex] || activeWaypoints[0];

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-57px)] bg-[#F8FAFC] text-slate-900 overflow-hidden select-none">
      
      {/* 1. TOP TITLE DECK & CONTEXT (HUMAN-CENTRIC & CLEAN) */}
      <div className="bg-white border-b border-slate-200 px-4 py-2.5 flex items-center justify-between gap-3 shrink-0 shadow-2xs">
        <div className="flex items-center space-x-3 min-w-0">
          <button
            onClick={onReturnToCommand}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors cursor-pointer shrink-0"
            title="Return to Command Center Overview"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Command Center</span>
          </button>

          <div className="h-4 w-px bg-slate-200 shrink-0" />

          <div className="flex items-center space-x-2 min-w-0">
            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${isPlaying ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            <h2 className="text-sm font-bold text-slate-900 truncate">
              Live Bus Edge-AI Simulation · <span className="text-blue-700 capitalize">{activeCity} Transit Network</span>
            </h2>
          </div>
        </div>

        {/* Status Pill & Guide Toggle */}
        <div className="flex items-center space-x-2.5 text-xs shrink-0">
          <span className={`px-2.5 py-1 rounded-full font-bold flex items-center space-x-1.5 border ${
            isPlaying 
              ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
              : 'bg-amber-50 text-amber-800 border-amber-300'
          }`}>
            <span className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-emerald-500 animate-ping' : 'bg-amber-500'}`} />
            <span>{isPlaying ? 'Bus Driving (AI Scanning)' : 'Simulation Paused'}</span>
          </span>

          <button
            onClick={() => setShowExplainerGuide(!showExplainerGuide)}
            className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 font-bold transition-colors cursor-pointer"
          >
            <Info className="w-3.5 h-3.5" />
            <span>{showExplainerGuide ? 'Hide Guide' : 'How It Works'}</span>
          </button>
        </div>
      </div>

      {/* OPTIONAL EXPANDABLE "HOW IT WORKS" VISUAL GUIDE */}
      {showExplainerGuide && (
        <div className="bg-white border-b border-slate-200 p-4 shrink-0 shadow-xs">
          <div className="max-w-5xl mx-auto">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5 flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>How Mobile Edge-AI Sensing Works (Plain English)</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="font-bold text-slate-900 mb-1 flex items-center space-x-2">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">1</span>
                  <span>Bus Cameras Record Road</span>
                </div>
                <p className="text-slate-600 text-xs">
                  Standard 1080p cameras mounted on municipal buses continuously scan the road surface at 30 frames per second.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="font-bold text-slate-900 mb-1 flex items-center space-x-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">2</span>
                  <span>On-Bus AI Spots Hazards</span>
                </div>
                <p className="text-slate-600 text-xs">
                  An onboard NVIDIA Jetson computer detects potholes, cracks, and traffic queues in 4.2ms without needing internet access.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="font-bold text-slate-900 mb-1 flex items-center space-x-2">
                  <span className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs">3</span>
                  <span>Instant Municipal Alerts</span>
                </div>
                <p className="text-slate-600 text-xs">
                  Only lightweight 1.2 KB alert cards are sent over 4G, saving 98.7% cellular bandwidth while immediately notifying repair crews.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. MAIN SIMULATION STAGE (TWO CLEAN COLUMNS) */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        
        {/* LEFT COLUMN: LARGE VIDEO PLAYER + CLEAN UNIFIED CONTROLS */}
        <div className="flex-1 flex flex-col p-4 bg-[#F1F3F5] overflow-y-auto space-y-3.5 min-w-0">
          
          {/* Main Video Player Container */}
          <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-black shadow-sm min-h-[380px] lg:min-h-[460px] flex flex-col justify-between">
            <div className="flex-1 w-full relative">
              <HudErrorBoundary>
                <BusVideoHUD
                  activeCity={activeCity}
                  activeBus={activeBus}
                  activeBusId={activeBusId}
                  activeCamera={activeCamera}
                  latestDetection={latestDetection}
                  isPlaying={isPlaying}
                  systemInfo={systemInfo}
                  onTogglePlay={onTogglePlay}
                  onPlayStateChange={() => {}}
                  onSelectBus={onSelectBus}
                  onInspectLatest={(defect) => {
                    if (cityAlerts.length > 0) {
                      const pth = cityAlerts.find(a => a.alert_type === 'pothole') || cityAlerts[0];
                      onInspectIncident(pth);
                    }
                  }}
                  onVideoProgress={onVideoProgress}
                  onSendLiveFrame={onSendLiveFrame}
                />
              </HudErrorBoundary>
            </div>

            {/* Video Sub-Bar: Clean Location & Route Progress */}
            <div className="bg-white px-4 py-2.5 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-slate-700 shrink-0">
              <div className="flex items-center space-x-2 truncate">
                <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {currentBusKey}
                </span>
                <span className="text-slate-400">·</span>
                <span className="text-slate-900 font-bold truncate">
                  📍 {currentWaypoint?.name || 'Corridor Landmark'}
                </span>
              </div>

              <div className="flex items-center space-x-3 text-slate-600 text-xs">
                <span>Speed: <b className="text-slate-900">{isPlaying ? (activeBus?.speed_kmh || 32) : 0} km/h</b></span>
                <span className="text-slate-300">|</span>
                <span>Route Completed: <b className="text-blue-600">{((videoProgress || 0) * 100).toFixed(0)}%</b></span>
              </div>
            </div>
          </div>

          {/* UNIFIED CONTROL CONSOLE DIRECTLY UNDER VIDEO */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3.5 shadow-xs">
            
            {/* ROW 1: WHICH BUS / ROUTE? */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Select Bus Route:
                </span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {cityBuses.map((b) => {
                  const isCurr = currentBusKey === b.id;
                  return (
                    <button
                      key={b.id}
                      onClick={() => onSelectBus(b.id)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-2 ${
                        isCurr
                          ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-500/40'
                          : 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <span className="text-sm">🚌</span>
                      <div className="text-left">
                        <div className="leading-tight">{b.id} · {b.route}</div>
                        <div className={`text-[10px] font-normal ${isCurr ? 'text-blue-100' : 'text-slate-500'}`}>
                          {b.name}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ROW 2: PLAYBACK & CAMERA ANGLE CONTROLS */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              
              {/* Camera Switcher Buttons */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
                {cameraAngles.map((c) => {
                  const isSel = activeCamera === c.id;
                  return (
                    <button
                      key={c.id}
                      onClick={() => onSelectCamera(c.id)}
                      className={`flex-1 sm:flex-none px-3.5 py-2 rounded-lg font-bold transition-all cursor-pointer flex items-center space-x-2 ${
                        isSel
                          ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                      }`}
                      title={c.subtitle}
                    >
                      <span className="text-sm">{c.icon}</span>
                      <span>{c.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Playback Suite */}
              <div className="flex items-center justify-end space-x-2">
                {/* Drive / Pause */}
                <button
                  onClick={onTogglePlay}
                  className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-xs transition-all cursor-pointer ${
                    isPlaying
                      ? 'bg-amber-600 hover:bg-amber-700 ring-2 ring-amber-400/40'
                      : 'bg-blue-600 hover:bg-blue-700 ring-2 ring-blue-500/40'
                  }`}
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
                  <span>{isPlaying ? 'PAUSE BUS' : 'DRIVE BUS'}</span>
                </button>

                {/* Step Forward */}
                <button
                  onClick={onStep}
                  disabled={isPlaying}
                  className="flex items-center space-x-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-40 transition-colors cursor-pointer shadow-2xs"
                  title="Advance 1 Waypoint / Frame Forward"
                >
                  <FastForward className="w-3.5 h-3.5 text-slate-600" />
                  <span>STEP +1</span>
                </button>

                {/* Speed Selector */}
                <div className="flex items-center bg-slate-100 border border-slate-200 rounded-xl p-1 text-xs font-bold">
                  {['0.5x', '1x', '2x'].map((s) => (
                    <button
                      key={s}
                      onClick={() => onChangeSpeed(s)}
                      className={`px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                        speed === s ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: FULL-HEIGHT INSPECTOR (EASY TO VIEW, NO SQUEEZED MAP!) */}
        <div className="w-96 lg:w-[440px] bg-white border-l border-slate-200 flex flex-col shrink-0 min-h-0 shadow-xs">
          
          {/* Main Sub-Tab Header */}
          <div className="p-3 border-b border-slate-200 flex items-center justify-between bg-slate-50/90 shrink-0">
            <div className="flex items-center space-x-1.5">
              <button
                onClick={() => setSelectedSubTab('detections')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedSubTab === 'detections'
                    ? 'bg-white text-blue-700 border border-slate-200 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                🚨 Hazards Found ({filteredAlerts.length})
              </button>
              <button
                onClick={() => setSelectedSubTab('radar')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedSubTab === 'radar'
                    ? 'bg-white text-blue-700 border border-slate-200 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                🗺️ Route Map
              </button>
              <button
                onClick={() => setSelectedSubTab('telemetry')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedSubTab === 'telemetry'
                    ? 'bg-white text-blue-700 border border-slate-200 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                ⚡ Edge AI
              </button>
            </div>
          </div>

          {/* TAB 1: DETECTED HAZARDS (FULL HEIGHT, BEAUTIFUL CARDS WITH PHOTOS) */}
          {selectedSubTab === 'detections' && (
            <div className="flex-1 flex flex-col min-h-0 bg-slate-50/50">
              {/* Severity Filter Strip */}
              <div className="px-3 py-2 border-b border-slate-200 bg-white flex items-center justify-between text-xs shrink-0">
                <span className="text-slate-500 text-xs flex items-center space-x-1 font-bold">
                  <Filter className="w-3.5 h-3.5 text-slate-400" />
                  <span>Filter by Severity:</span>
                </span>
                <div className="flex items-center space-x-1">
                  {['ALL', 'CRITICAL', 'HIGH'].map((f) => (
                    <button
                      key={f}
                      onClick={() => setSeverityFilter(f)}
                      className={`px-2.5 py-1 rounded-md text-xs font-bold cursor-pointer transition-colors ${
                        severityFilter === f
                          ? 'bg-blue-600 text-white shadow-2xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {/* Scrollable Alerts List */}
              <div className="flex-1 p-3 overflow-y-auto space-y-3">
                {filteredAlerts.length === 0 ? (
                  <div className="text-center py-16 text-slate-400 text-xs space-y-2">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto opacity-70" />
                    <p className="font-bold text-slate-600">No active hazards found matching this filter.</p>
                    <p className="text-xs text-slate-400">Click "DRIVE BUS" to start scanning the corridor.</p>
                  </div>
                ) : (
                  filteredAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      onClick={() => onInspectIncident(alert)}
                      className="p-3.5 rounded-xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group shadow-2xs space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center space-x-1.5">
                          <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                            {alert.alert_code}
                          </span>
                          <span
                            className={`text-xs font-extrabold px-2 py-0.5 rounded uppercase ${
                              alert.priority_level === 'P0' || alert.severity === 'CRITICAL'
                                ? 'bg-red-50 text-red-700 border border-red-200'
                                : alert.priority_level === 'P1' || alert.severity === 'HIGH'
                                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                : 'bg-blue-50 text-blue-700 border border-blue-200'
                            }`}
                          >
                            {alert.priority_level === 'P0' ? 'P0 Critical' : alert.priority_level === 'P1' ? 'P1 High' : 'P2 Medium'}
                          </span>
                        </div>

                        <span className="text-xs text-slate-400 flex items-center space-x-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>
                            {new Date(alert.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors uppercase">
                          {alert.alert_type?.replace(/_/g, ' ')}
                        </h4>
                        <span className="text-xs font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full">
                          {alert.sighting_count || 1} Sweeps Verified
                        </span>
                      </div>

                      <p className="text-xs text-slate-500 truncate">
                        📍 {alert.location_name}
                      </p>

                      <div className="grid grid-cols-2 gap-1.5 bg-slate-50 p-2 rounded-lg border border-slate-100 text-xs text-slate-600">
                        <div>Depth: <b className="text-slate-900">{alert.defect_depth_est || '~5.8 cm'}</b></div>
                        <div>Area: <b className="text-slate-900">{alert.defect_area_est || '0.35 sq.m'}</b></div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-blue-600 font-bold pt-1 border-t border-slate-100 group-hover:translate-x-0.5 transition-transform">
                        <span>Inspect Photos & Work Order</span>
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 2: LIVE ROUTE MAP (FULL HEIGHT, INTERACTIVE & SPACIOUS) */}
          {selectedSubTab === 'radar' && (
            <div className="flex-1 flex flex-col min-h-0 bg-white">
              {/* Waypoint Status Header */}
              <div className="p-3 border-b border-slate-200 bg-slate-50 shrink-0">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-slate-900">Current Stop Progression</span>
                  <span className="text-blue-600 font-bold">
                    Stop {currentWpIndex + 1} of {activeWaypoints.length}
                  </span>
                </div>
                <p className="text-xs text-slate-600 font-bold truncate">
                  📍 {currentWaypoint?.name}
                </p>
              </div>

              {/* Full-Height Leaflet Map Container */}
              <div className="flex-1 relative min-h-0">
                <LiveMap
                  activeCity={activeCity}
                  selectedCategory="all"
                  alerts={alerts}
                  buses={buses}
                  activeBus={activeBus}
                  isPlaying={isPlaying}
                  videoProgress={videoProgress}
                  selectedIncident={null}
                  onSelectAlert={(al) => onInspectIncident(al)}
                  onSelectBus={() => {}}
                />
              </div>

              {/* Compact Route Stops Drawer */}
              <div className="h-44 border-t border-slate-200 overflow-y-auto p-2.5 space-y-1.5 bg-slate-50 shrink-0">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Route Stops Checklist:
                </span>
                {activeWaypoints.map((wp, idx) => {
                  const isPassed = idx < currentWpIndex;
                  const isCurrent = idx === currentWpIndex;

                  return (
                    <div
                      key={wp.seq}
                      className={`px-2.5 py-1.5 rounded-lg border text-xs flex items-center justify-between transition-all ${
                        isCurrent
                          ? 'bg-blue-50 border-blue-300 font-bold text-blue-900 shadow-2xs'
                          : isPassed
                          ? 'bg-white border-emerald-200 text-slate-700'
                          : 'bg-white border-slate-200 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center space-x-2 truncate">
                        <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          isCurrent
                            ? 'bg-blue-600 text-white'
                            : isPassed
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-200 text-slate-600'
                        }`}>
                          {isPassed ? '✓' : wp.seq}
                        </span>
                        <span className="truncate">{wp.name}</span>
                      </div>
                      <span className="text-[10px] uppercase font-bold shrink-0">
                        {isCurrent ? 'BUS HERE' : isPassed ? 'PASSED' : wp.tag}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: EDGE AI SPECS & HARDWARE (CLEAN & FRIENDLY) */}
          {selectedSubTab === 'telemetry' && (
            <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs bg-slate-50/50">
              
              <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-2xs">
                <div className="flex items-center space-x-2.5">
                  <span className="p-2 rounded-xl bg-blue-100 text-blue-700">
                    <Cpu className="w-5 h-5" />
                  </span>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">On-Bus AI Computer</h4>
                    <p className="text-slate-500 text-xs">NVIDIA Jetson Orin Nano (Mounted on bus)</p>
                  </div>
                </div>

                <div className="space-y-2 border-t border-slate-100 pt-2 text-slate-600 text-xs">
                  <div className="flex justify-between">
                    <span>AI Engine:</span>
                    <b className="text-emerald-700 font-bold">TensorRT FP16 (4.2 ms / frame)</b>
                  </div>
                  <div className="flex justify-between">
                    <span>Processing Speed:</span>
                    <b className="text-slate-900">30 Frames Per Second (Real Time)</b>
                  </div>
                  <div className="flex justify-between">
                    <span>Double-Check Sensor:</span>
                    <b className="text-amber-700 font-bold">Axle IMU Shockwave Fusion</b>
                  </div>
                  <div className="flex justify-between">
                    <span>Offline Storage:</span>
                    <b className="text-purple-700 font-bold">SQLite WAL Buffer (Zero data loss)</b>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2.5 shadow-2xs">
                <div className="flex items-center space-x-2.5">
                  <span className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
                    <TrendingDown className="w-5 h-5" />
                  </span>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">98.7% Data Cost Reduction</h4>
                    <p className="text-slate-500 text-xs">Why edge computing saves millions for cities</p>
                  </div>
                </div>

                <div className="space-y-2 text-xs border-t border-slate-100 pt-2 text-slate-600">
                  <div className="flex justify-between">
                    <span>Streaming Raw Video to Cloud:</span>
                    <span className="text-red-700 font-bold">~18.2 GB / hour / bus</span>
                  </div>
                  <div className="flex justify-between">
                    <span>RoadWise Edge Telemetry:</span>
                    <span className="text-emerald-700 font-bold">~2.4 MB / hour / bus</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-medium">
                    💡 Instead of paying for massive 4G/5G video streaming, the bus only transmits tiny 1.2 KB alert cards when actual road damage is found.
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
}


