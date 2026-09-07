import React, { useRef, useState, useEffect } from 'react';
// BUG-012 FIX: Removed unused imports ShieldAlert and Car (flash alert banners were removed)
import { 
  Cpu, Volume2, VolumeX, Play, Pause, Camera, Activity
} from 'lucide-react';

export default function BusVideoHUD({ 
  activeBus, 
  latestDetection, 
  isPlaying, 
  systemInfo,
  onTogglePlay,
  onPlayStateChange,
  onSelectBus,
  onInspectLatest,
  onVideoProgress,
  onSendLiveFrame
}) {
  const videoRef = useRef(null);
  const [isMuted, setIsMuted] = useState(true);
  const [flashAlert, setFlashAlert] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const lastCaptureTimeRef = useRef(0);

  // Available feeds mapped to the fleet buses across cities
  const busFeeds = {
    'HYD-101': { label: 'HYD-101 · Hitec City Corridor (1080p)', url: '/videos/bus_dashcam_feed.mp4' },
    'HYD-204': { label: 'HYD-204 · Secunderabad Corridor (1080p)', url: '/videos/pune_monsoon.mp4' },
    'HYD-305': { label: 'HYD-305 · Charminar Express (1080p)', url: '/videos/traffic_jam.mp4' },
    'BUS-104': { label: 'BUS-104 · Sus Road Potholes (1080p)', url: '/videos/bus_dashcam_feed.mp4' },
    'BUS-218': { label: 'BUS-218 · Monsoon City Potholes (1080p)', url: '/videos/pune_monsoon.mp4' },
    'BUS-301': { label: 'BUS-301 · Tourist Highway Traffic Jam (1080p)', url: '/videos/traffic_jam.mp4' }
  };

  const currentBusKey = activeBus?.bus_label || 'HYD-101';
  const currentFeed = busFeeds[currentBusKey]?.url || '/videos/bus_dashcam_feed.mp4';

  const defaultVehicles = currentBusKey === 'BUS-301' ? 22 : currentBusKey === 'BUS-218' ? 7 : 4;
  const defaultDensity = currentBusKey === 'BUS-301' ? 'HIGH' : currentBusKey === 'BUS-218' ? 'MODERATE' : 'LOW';

  const displayVehicles = latestDetection?.total_vehicles !== undefined ? latestDetection.total_vehicles : defaultVehicles;
  const displayDensity = latestDetection?.density_level || defaultDensity;

  const hardwareLabel = systemInfo?.device_type === 'GPU'
    ? `${systemInfo.device_name || 'CUDA GPU'} (${systemInfo.avg_inference_latency_ms || 4.2}ms)`
    : `EDGE CPU INFERENCE (${systemInfo?.avg_inference_latency_ms || 18.5}ms)`;

  // Capture exact live frame from <video> element via fast offscreen canvas
  const captureCurrentVideoFrame = () => {
    if (!videoRef.current || videoRef.current.readyState < 2) return null;
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 360;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL('image/jpeg', 0.85);
    } catch (e) {
      return null;
    }
  };

  // Sync video play/pause with parent isPlaying state
  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.play().catch((err) => {
          console.log("Autoplay waiting for click:", err);
        });
      } else {
        videoRef.current.pause();
      }
    }
  }, [isPlaying, currentFeed]);

  const handleTogglePlay = () => {
    if (onTogglePlay) {
      onTogglePlay();
    } else if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play().then(() => {
          if (onPlayStateChange) onPlayStateChange(true);
        }).catch(() => {});
      } else {
        videoRef.current.pause();
        if (onPlayStateChange) onPlayStateChange(false);
      }
    }
  };

  const handleTimeUpdate = (e) => {
    const v = e.target;
    if (v && v.duration) {
      setCurrentTime(v.currentTime);
      setDuration(v.duration);
      const progress = Math.max(0, Math.min(v.currentTime / v.duration, 1.0));
      
      // Send live video frame to YOLO model periodically ONLY during active playback
      const now = performance.now();
      if (isPlaying && videoRef.current && !videoRef.current.paused && (now - lastCaptureTimeRef.current > 1600)) {
        lastCaptureTimeRef.current = now;
        const b64 = captureCurrentVideoFrame();
        if (b64 && onSendLiveFrame) {
          onSendLiveFrame(b64, progress, v.currentTime);
        }
      }

      if (onVideoProgress) {
        onVideoProgress(progress, v.currentTime, v.duration);
      }
    }
  };

  const handleSeek = (e) => {
    const newProgress = parseFloat(e.target.value);
    if (videoRef.current && duration > 0) {
      videoRef.current.currentTime = newProgress * duration;
      setCurrentTime(newProgress * duration);
      
      // On seek while driving, send single frame
      if (isPlaying) {
        const b64 = captureCurrentVideoFrame();
        if (b64 && onSendLiveFrame) {
          onSendLiveFrame(b64, newProgress, newProgress * duration);
        }
      }

      if (onVideoProgress) {
        onVideoProgress(newProgress, newProgress * duration, duration);
      }
    }
  };

  const formatTime = (secs) => {
    if (!secs || isNaN(secs)) return "00:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Flash detection indicator on HUD when new detection occurs
  useEffect(() => {
    if (isPlaying && latestDetection && (latestDetection.has_pothole || latestDetection.density_level === 'HIGH' || latestDetection.total_vehicles >= 8)) {
      setFlashAlert(latestDetection);
      const timer = setTimeout(() => setFlashAlert(null), 3500);
      return () => clearTimeout(timer);
    } else if (!isPlaying) {
      setFlashAlert(null);
    }
  }, [latestDetection, isPlaying]);

  // BUG-011 FIX: Guard against NaN/Infinity when duration is 0 or currentTime is invalid.
  // Old: duration defaulted to 0, and || 1 in onLoadedMetadata could flash scrubber to 100%.
  const progressValue = (duration > 0 && !isNaN(currentTime) && isFinite(currentTime))
    ? Math.max(0, Math.min(currentTime / duration, 1))
    : 0;

  return (
    <div className="relative w-full h-full min-h-[360px] bg-slate-950 rounded-xl overflow-hidden border border-slate-200 shadow-xs flex flex-col justify-between group">
      
      {/* Real Dashcam HTML5 Video Player */}
      <video
        key={currentFeed}
        ref={videoRef}
        src={currentFeed}
        loop
        muted={isMuted}
        playsInline
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={(e) => { if (e.target.duration > 0) setDuration(e.target.duration); }}
        onPlay={() => onPlayStateChange && onPlayStateChange(true)}
        onPause={() => onPlayStateChange && onPlayStateChange(false)}
        className="absolute inset-0 w-full h-full object-cover cursor-pointer"
        onClick={handleTogglePlay}
      />

      {/* Dark Gradient Vignette for readable HUD overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-slate-950/65 pointer-events-none"></div>

      {/* Top HUD Telemetry Bar */}
      <div className="relative z-10 p-3 flex items-center justify-between text-white">
        <div className="flex items-center space-x-2">
          <div className={`w-2.5 h-2.5 rounded-full ${isPlaying ? 'bg-red-500 animate-ping' : 'bg-slate-400'}`}></div>
          
          {/* Bus / Feed Selector Dropdown */}
          <select
            value={currentBusKey}
            onChange={(e) => onSelectBus && onSelectBus(e.target.value)}
            className="bg-slate-900/90 text-xs font-mono font-bold text-slate-100 border border-white/20 rounded-md px-2.5 py-1 focus:outline-none focus:border-blue-400 cursor-pointer"
          >
            <option value="BUS-104" className="bg-slate-900 text-white">📹 BUS-104 · Sus Road Potholes</option>
            <option value="BUS-218" className="bg-slate-900 text-white">📹 BUS-218 · Monsoon Road Defects</option>
            <option value="BUS-301" className="bg-slate-900 text-white">📹 BUS-301 · Highway Traffic Jam</option>
          </select>

          <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold ${
            isPlaying ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-300'
          }`}>
            {isPlaying ? 'DRIVING' : 'STANDBY'}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {/* Simulated Axle IMU Sensor Fusion Indicator */}
          <div className={`px-2 py-0.5 rounded text-[10px] font-mono flex items-center space-x-1 border ${
            !isPlaying
              ? 'bg-slate-900/90 border-slate-700 text-slate-400'
              : latestDetection?.has_pothole
              ? 'bg-red-950/90 border-red-500 text-red-300 animate-pulse'
              : 'bg-slate-900/90 border-emerald-500/50 text-emerald-300'
          }`} title="Axle IMU Vibration Sensor Fusion (Z-Axis Shockwave G-Force)">
            <Activity className="w-3 h-3" />
            <span>
              IMU: {isPlaying ? (latestDetection?.has_pothole ? 'Δgz 2.45g (SPIKE)' : 'Δgz 1.02g (NOMINAL)') : '0.00g (IDLE)'}
            </span>
          </div>

          <div className={`px-2 py-0.5 rounded text-[10px] font-mono flex items-center space-x-1 border ${
            isPlaying 
              ? 'bg-blue-950/90 border-blue-400/50 text-blue-300' 
              : 'bg-slate-900/90 border-slate-700 text-slate-400'
          }`}>
            <Cpu className="w-3 h-3 text-blue-400" />
            <span>{isPlaying ? 'YOLOv8 Active (4.2ms)' : 'AI Paused (Idle)'}</span>
          </div>

          {/* Audio toggle */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-1.5 rounded-md bg-slate-900/80 text-slate-300 hover:text-white border border-white/20 transition-colors"
            title={isMuted ? "Unmute Audio" : "Mute Audio"}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
          </button>
        </div>
      </div>

      {/* Center Manual Play Overlay (Only when Paused) */}
      <div className="relative z-10 px-4 flex flex-col items-center justify-center my-auto pointer-events-none">
        {!isPlaying && (
          <button
            onClick={handleTogglePlay}
            className="p-4 rounded-full bg-blue-600/95 text-white border-2 border-white shadow-2xl hover:scale-105 transition-transform mt-2 flex items-center space-x-2.5 font-mono text-xs font-bold pointer-events-auto cursor-pointer"
          >
            <Play className="w-5 h-5 fill-white" />
            <span>START {currentBusKey} FEED (DRIVE)</span>
          </button>
        )}
      </div>

      {/* Synchronized Video Scrubber & Bottom Live Edge Telemetry Bar */}
      <div className="relative z-10 bg-slate-950/95 backdrop-blur-xs border-t border-white/15 text-white flex flex-col">
        
        {/* Scrubber Bar synced with Map Progress */}
        <div className="px-3 pt-2 pb-1 flex items-center space-x-2.5">
          <span className="text-[10px] font-mono text-slate-400 shrink-0">
            {formatTime(currentTime)}
          </span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.001"
            value={progressValue}
            onChange={handleSeek}
            className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400"
            title="Drag to seek synchronized video position and map location"
          />
          <span className="text-[10px] font-mono text-slate-400 shrink-0">
            {formatTime(duration)}
          </span>
        </div>

        <div className="px-3 pb-2.5 pt-0.5 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center space-x-3">
            <button
              onClick={handleTogglePlay}
              className={`p-1.5 rounded text-white flex items-center space-x-1 text-[11px] font-bold ${
                isPlaying ? 'bg-amber-600 hover:bg-amber-700' : 'bg-blue-600 hover:bg-blue-700'
              }`}
              title={isPlaying ? "Stop Bus & Video" : "Move Bus & Play Video"}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-white" />}
              <span>{isPlaying ? 'PAUSE' : 'DRIVE'}</span>
            </button>
            
            <div>
              <span className="text-slate-400 text-[10px] block">SPEED</span>
              <span className={`font-bold ${isPlaying ? 'text-slate-100' : 'text-amber-400'}`}>
                {isPlaying ? (activeBus?.speed_kmh || 34.0) : 0.0} km/h
              </span>
            </div>

            <div className="hidden sm:block">
              <span className="text-slate-400 text-[10px] block">GPS COORDINATES</span>
              <span className="text-slate-200">
                {activeBus?.current_lat?.toFixed(4) || '18.5558'}° N, {activeBus?.current_lng?.toFixed(4) || '73.9064'}° E
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3 text-right">
            <div>
              <span className="text-slate-400 text-[10px] block">LIVE VEHICLE COUNT</span>
              <span className={`font-bold text-sm ${
                displayDensity === 'HIGH' ? 'text-amber-400' : 'text-emerald-400'
              }`}>
                {displayVehicles} vehicles ({displayDensity})
              </span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] block">ROUTE CORRIDOR</span>
              <span className="text-blue-300 font-sans font-medium text-[11px]">
                {activeBus?.route_id || 'Route 115'}
              </span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
