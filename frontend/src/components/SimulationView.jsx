import React, { useState } from 'react';
import {
  Camera,
  Play,
  Pause,
  FastForward,
  RotateCcw,
  Cpu,
  Layers,
  MapPin,
  Activity,
  ShieldAlert,
  Flame,
  AlertTriangle,
  CheckCircle2,
  HardDrive,
  Eye,
  ExternalLink,
  ChevronRight,
  Maximize2,
  Clock,
  Zap,
  ArrowLeft,
  Video
} from 'lucide-react';
import BusVideoHUD from './BusVideoHUD';
import LiveMap from './LiveMap';

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
  const [selectedSubTab, setSelectedSubTab] = useState('detections'); // 'detections' | 'telemetry'

  const cityBuses =
    activeCity === 'hyderabad'
      ? [
          { id: 'HYD-101', label: 'HYD-101 (Route 216 - Hitec City / Financial Dist)', driver: 'R. Sharma', speed: 32 },
          { id: 'HYD-204', label: 'HYD-204 (Route 10H - Secunderabad / Begumpet)', driver: 'M. Ali', speed: 28 },
          { id: 'HYD-305', label: 'HYD-305 (Route 5K - Charminar / Koti / Dilsukhnagar)', driver: 'K. Reddy', speed: 25 }
        ]
      : [
          { id: 'BUS-104', label: 'BUS-104 (Route 115 - Swargate / Katraj)', driver: 'S. Patil', speed: 30 },
          { id: 'BUS-218', label: 'BUS-218 (Route 500D - Hinjawadi / Shivaji Nagar)', driver: 'A. Joshi', speed: 34 },
          { id: 'BUS-301', label: 'BUS-301 (Route 335E - Hadapsar / Station)', driver: 'P. Shinde', speed: 29 }
        ];

  const cameraAngles = [
    { id: 'CAM-1-FRONT', label: 'CAM 1 ? Front Road AI', desc: 'Pothole, Crack, Missing Divider, ANPR' },
    { id: 'CAM-2-SIDE', label: 'CAM 2 ? Left Curb & Pavement', desc: 'Water Logging, Faded Zebra, Garbage' },
    { id: 'CAM-3-REAR', label: 'CAM 3 ? Rear & Blindspot', desc: 'Helmet Violations, Overloaded 2W, Tailgating' }
  ];

  // Recent detections filtered to active city
  const cityAlerts = alerts.filter(
    (a) => !a.city_id || a.city_id.toLowerCase() === activeCity.toLowerCase()
  );

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-57px)] bg-[#F8FAFC] text-slate-900 overflow-hidden">
      {/* 1. TOP SIMULATION HEADER DECK (WHITE THEME) */}
      <div className="bg-white border-b border-slate-200 px-4 py-2.5 flex items-center justify-between shrink-0 shadow-2xs">
        <div className="flex items-center space-x-3">
          <button
            onClick={onReturnToCommand}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors cursor-pointer shadow-2xs"
            title="Return to Command Center Map and Priority Table"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Command Center</span>
          </button>

          <div className="h-4 w-px bg-slate-200" />

          <div className="flex items-center space-x-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isPlaying ? 'bg-emerald-400 opacity-75' : 'bg-amber-400 opacity-75'}`}></span>
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isPlaying ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
            </span>
            <h2 className="text-sm font-bold font-mono tracking-wider uppercase text-slate-900">
              MOBILE EDGE-AI BUS SIMULATION ? {activeCity.toUpperCase()}
            </h2>
          </div>
        </div>

        {/* Jetson Orin Edge Telemetry Bar (Light Badges) */}
        <div className="flex items-center space-x-2 text-[11px] font-mono">
          <div className="hidden md:flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-700">
            <Cpu className="w-3.5 h-3.5 text-blue-600" />
            <span>JETSON ORIN: <b className="text-emerald-700">78% LOAD</b></span>
          </div>
          <div className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-700">
            <Zap className="w-3.5 h-3.5 text-amber-600" />
            <span>INFERENCE: <b className="text-blue-700">28.4 ms</b></span>
          </div>
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-700">
            <HardDrive className="w-3.5 h-3.5 text-purple-600" />
            <span>CACHE: <b className="text-purple-700">LOCAL SQLITE</b></span>
          </div>
        </div>
      </div>

      {/* 2. MAIN SIMULATION STAGE (TWO COLUMNS: VIDEO PLAYER + TELEMETRY / DETECTIONS) */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* LEFT COLUMN: LARGE VIDEO HUD + CONTROL CONSOLE */}
        <div className="flex-1 flex flex-col p-4 bg-[#F1F3F5] overflow-y-auto space-y-4 min-w-0">
          {/* Main Video Box with Clean Light Framing */}
          <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-black shadow-sm min-h-[380px] lg:min-h-[460px] flex flex-col justify-between">
            <div className="flex-1 w-full relative">
              <BusVideoHUD
                activeBus={activeBus}
                latestDetection={latestDetection}
                isPlaying={isPlaying}
                systemInfo={systemInfo}
                onTogglePlay={onTogglePlay}
                onPlayStateChange={() => {}}
                onSelectBus={onSelectBus}
                onInspectLatest={() => {
                  if (cityAlerts.length > 0) onInspectIncident(cityAlerts[0]);
                }}
                onVideoProgress={onVideoProgress}
                onSendLiveFrame={onSendLiveFrame}
              />
            </div>

            {/* Video Overlay Info Bar (White / Light Theme) */}
            <div className="bg-white/95 backdrop-blur-md px-4 py-2.5 border-t border-slate-200 flex items-center justify-between text-xs font-mono text-slate-700 shrink-0">
              <div className="flex items-center space-x-3">
                <span className="text-emerald-700 font-bold flex items-center space-x-1 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>{activeCamera}</span>
                </span>
                <span className="text-slate-300">|</span>
                <span className="text-slate-900 font-bold">{activeBus?.bus_label || activeBusId}</span>
                <span className="text-slate-300">|</span>
                <span className="text-slate-500 truncate max-w-xs">{activeBus?.route_name || 'Transit Corridor'}</span>
              </div>
              <div className="flex items-center space-x-3 text-[11px]">
                <span>SPEED: <b className="text-slate-900">{activeBus?.speed_kmh || 32.0} km/h</b></span>
                <span className="text-slate-300">|</span>
                <span>PROGRESS: <b className="text-blue-600">{(videoProgress * 100).toFixed(1)}%</b></span>
              </div>
            </div>
          </div>

          {/* SIMULATION CONTROL CONSOLE (WHITE THEME) */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3.5 shadow-xs">
            {/* Row 1: Bus Selector */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <span className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider">
                Active Mobile Edge Node:
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {cityBuses.map((b) => {
                  const isCurr = (activeBus?.bus_label || activeBusId) === b.id;
                  return (
                    <button
                      key={b.id}
                      onClick={() => onSelectBus(b.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                        isCurr
                          ? 'bg-blue-600 text-white shadow-xs ring-2 ring-blue-500/40'
                          : 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      {b.id}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Row 2: Camera Feeds & Playback Bar */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              {/* Camera Angle Selector */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-mono">
                {cameraAngles.map((c) => {
                  const isSel = activeCamera === c.id;
                  return (
                    <button
                      key={c.id}
                      onClick={() => onSelectCamera(c.id)}
                      className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                        isSel
                          ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                      }`}
                      title={c.desc}
                    >
                      {c.label.split('?')[0]}
                    </button>
                  );
                })}
              </div>

              {/* Playback Controls Suite */}
              <div className="flex items-center justify-end space-x-2">
                {/* Play / Pause Toggle */}
                <button
                  onClick={onTogglePlay}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold font-mono text-white shadow-xs transition-all cursor-pointer ${
                    isPlaying
                      ? 'bg-amber-600 hover:bg-amber-700 ring-2 ring-amber-400/40'
                      : 'bg-blue-600 hover:bg-blue-700 ring-2 ring-blue-500/40'
                  }`}
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  <span>{isPlaying ? 'PAUSE FEED' : 'START SIMULATION'}</span>
                </button>

                {/* Step Frame */}
                <button
                  onClick={onStep}
                  disabled={isPlaying}
                  className="flex items-center space-x-1 px-3 py-2 rounded-xl text-xs font-mono font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-40 transition-colors cursor-pointer shadow-2xs"
                  title="Advance 1 Step / Waypoint"
                >
                  <FastForward className="w-3.5 h-3.5 text-slate-600" />
                  <span>STEP</span>
                </button>

                {/* Speed Multiplier */}
                <div className="flex items-center bg-slate-100 border border-slate-200 rounded-xl p-1 text-xs font-mono">
                  {['1x', '2x', '3x'].map((s) => (
                    <button
                      key={s}
                      onClick={() => onChangeSpeed(s)}
                      className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
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

        {/* RIGHT COLUMN: REAL-TIME EVENT STREAM & SYNCHRONIZED CORRIDOR RADAR (WHITE THEME) */}
        <div className="w-96 lg:w-[420px] bg-white border-l border-slate-200 flex flex-col shrink-0 min-h-0">
          {/* Sub-Tab Navigation Header */}
          <div className="p-3 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
            <div className="flex items-center space-x-1.5">
              <button
                onClick={() => setSelectedSubTab('detections')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                  selectedSubTab === 'detections'
                    ? 'bg-white text-blue-700 border border-slate-200 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                Live Detections ({cityAlerts.length})
              </button>
              <button
                onClick={() => setSelectedSubTab('telemetry')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                  selectedSubTab === 'telemetry'
                    ? 'bg-white text-blue-700 border border-slate-200 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                Edge AI Pipeline
              </button>
            </div>

            <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-bold">
              SYNC ACTIVE
            </span>
          </div>

          {/* SUB-VIEW 1: LIVE DETECTIONS STREAM (LIGHT CARDS) */}
          {selectedSubTab === 'detections' && (
            <div className="flex-1 p-3 overflow-y-auto space-y-2.5 bg-slate-50/50">
              {cityAlerts.length === 0 ? (
                <div className="text-center py-16 text-slate-400 text-xs font-mono">
                  No active detections on this corridor yet. Run simulation to trigger edge AI inference.
                </div>
              ) : (
                cityAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    onClick={() => onInspectIncident(alert)}
                    className="p-3.5 rounded-xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group shadow-2xs"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center space-x-1.5">
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                          {alert.alert_code}
                        </span>
                        <span
                          className={`text-[9px] font-mono font-extrabold px-2 py-0.5 rounded uppercase ${
                            alert.priority_level === 'P0' || alert.severity === 'CRITICAL'
                              ? 'bg-red-50 text-red-700 border border-red-200'
                              : alert.priority_level === 'P1' || alert.severity === 'HIGH'
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}
                        >
                          {alert.priority_level || alert.severity}
                        </span>
                      </div>

                      <span className="text-[10px] font-mono text-slate-400 flex items-center space-x-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{new Date(alert.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </span>
                    </div>

                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors uppercase">
                        {alert.alert_type?.replace(/_/g, ' ')}
                      </h4>
                      <span className="text-[10px] font-mono text-purple-700 bg-purple-50 border border-purple-200 px-1.5 py-0.5 rounded font-bold">
                        {alert.sighting_count || 1} Passes
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500 truncate mb-2">
                      {alert.location_name}
                    </p>

                    <div className="grid grid-cols-2 gap-1.5 bg-slate-50 p-2 rounded-lg border border-slate-100 text-[10px] font-mono text-slate-600">
                      <div>CONF: <b className="text-emerald-700 font-bold">{((alert.confidence || 0.9) * 100).toFixed(0)}%</b></div>
                      <div>AREA: <b className="text-slate-900 font-bold">{alert.defect_area_est || '0.35 sq.m'}</b></div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* SUB-VIEW 2: EDGE-AI PIPELINE & HARDWARE TELEMETRY (LIGHT THEME) */}
          {selectedSubTab === 'telemetry' && (
            <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs font-mono bg-slate-50/50">
              <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-2xs">
                <h4 className="font-bold text-slate-900 flex items-center space-x-2 text-sm">
                  <Cpu className="w-4 h-4 text-blue-600" />
                  <span>NVIDIA Jetson Orin Nano / AGX</span>
                </h4>
                <div className="space-y-2 text-slate-600">
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span>GPU Architecture:</span>
                    <b className="text-slate-900">Ampere (1024 CUDA, 32 Tensor)</b>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span>AI Inference Engine:</span>
                    <b className="text-emerald-700 font-bold">TensorRT FP16</b>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span>Object Detection:</span>
                    <b className="text-slate-900">YOLOv8 Custom Trained</b>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span>Multi-Object Tracking:</span>
                    <b className="text-slate-900">ByteTrack Kalman Filter</b>
                  </div>
                  <div className="flex justify-between">
                    <span>Local Edge Storage:</span>
                    <b className="text-purple-700 font-bold">SQLite WAL Mode (Offline Cache)</b>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2.5 shadow-2xs">
                <h4 className="font-bold text-slate-900 flex items-center space-x-2 text-sm">
                  <Zap className="w-4 h-4 text-amber-600" />
                  <span>Edge-to-Cloud Sync Protocol</span>
                </h4>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  The bus processes raw 30 FPS camera frames entirely on the edge. High-severity defects (P0/P1) are deduplicated locally using GPS proximity hashing (3m radius) and multi-pass verification before transmitting structured telemetry packets over 4G/5G MQTT.
                </p>
              </div>
            </div>
          )}

          {/* Footer mini-corridor map snippet */}
          <div className="p-3 border-t border-slate-200 bg-slate-50 shrink-0">
            <div className="h-40 rounded-xl overflow-hidden border border-slate-200 bg-white shadow-2xs relative">
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
          </div>
        </div>
      </div>
    </div>
  );
}
