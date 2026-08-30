import React from 'react';
import {
  Play, Pause, RotateCcw, FastForward, Upload,
  Bus, ShieldCheck, Activity, MapPin, Zap, RefreshCw, ChevronDown
} from 'lucide-react';

export default function Header({
  simStatus,
  isPlaying,
  onTogglePlay,
  onStep,
  onReset,
  speed,
  onChangeSpeed,
  onOpenUpload,
  onRefresh,
  stats,
  buses = [],
  activeBusId = 'BUS-104',
  onSelectBusId
}) {
  const busConfigs = [
    { id: 'BUS-104', label: 'BUS-104 (Sus Road · Severe Potholes)', route: 'Route 115' },
    { id: 'BUS-218', label: 'BUS-218 (Pune Monsoon · Road Cavities)', route: 'Route 500D' },
    { id: 'BUS-301', label: 'BUS-301 (Highway · Dense Traffic Flow)', route: 'Route 335E' }
  ];

  return (
    <header className="bg-white border-b border-slate-200 px-6 py-3 sticky top-0 z-30 shadow-xs">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">

        {/* Brand & System Status */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
              <Bus className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-slate-900 text-lg tracking-tight">ROADWISE</span>
                <span className="text-[10px] font-semibold tracking-wider bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
                  AI PLATFORM
                </span>
                <span className="text-[10px] font-mono text-slate-400">SIH26124</span>
              </div>
              <p className="text-xs text-slate-500 font-medium">Urban Transit Mobile Edge-AI Sensing Network</p>
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-2 pl-4 border-l border-slate-200">
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>AI Engine Active</span>
            </div>

            {/* Active Bus Selector Dropdown */}
            <div className="flex items-center space-x-1.5 bg-blue-50 border border-blue-200 rounded-lg px-2 py-1">
              <span className="text-[10px] font-bold text-blue-800 uppercase font-mono">NODE:</span>
              <select
                value={activeBusId}
                onChange={(e) => onSelectBusId && onSelectBusId(e.target.value)}
                className="bg-transparent text-xs font-bold text-blue-900 font-mono focus:outline-none cursor-pointer"
              >
                {busConfigs.map((b) => (
                  <option key={b.id} value={b.id} className="bg-white text-slate-900 font-sans">
                    🚌 {b.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="text-xs text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
              Avg Acc: <span className="font-semibold text-blue-700">{((stats?.avg_confidence || 0.94) * 100).toFixed(1)}%</span>
            </div>
          </div>
        </div>

        {/* Live Simulation Controls & Actions */}
        <div className="flex items-center flex-wrap gap-2">

          {/* Simulation Controller Group */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 space-x-1">
            <button
              onClick={onTogglePlay}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${isPlaying
                ? 'bg-amber-500 text-white shadow-xs hover:bg-amber-600'
                : 'bg-blue-600 text-white shadow-xs hover:bg-blue-700'
                }`}
              title={isPlaying ? "Pause Simulation" : "Start Live Simulation Feed"}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isPlaying ? 'PAUSE' : 'LIVE SIMULATION'}</span>
            </button>

            <button
              onClick={onStep}
              disabled={isPlaying}
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-700 hover:bg-white hover:shadow-xs transition-all disabled:opacity-40"
              title="Advance single frame"
            >
              <FastForward className="w-3.5 h-3.5 text-slate-600" />
              <span>Step</span>
            </button>

            {/* Speed selection */}
            <div className="flex items-center pl-1 text-[11px] font-mono text-slate-600">
              {['1x', '2x', '3x'].map((s) => (
                <button
                  key={s}
                  onClick={() => onChangeSpeed(s)}
                  className={`px-1.5 py-0.5 rounded ${speed === s ? 'bg-white font-bold text-blue-600 shadow-2xs' : 'hover:text-slate-900'}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Refresh button */}
          <button
            onClick={onRefresh}
            className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Jury Demo Clean Reset */}
          <button
            onClick={onReset}
            className="flex items-center space-x-1.5 px-3 py-2 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold hover:bg-rose-100 hover:border-rose-300 transition-colors shadow-2xs"
            title="Purge all prior alerts & reset simulation for a fresh jury demonstration"
          >
            <RotateCcw className="w-3.5 h-3.5 text-rose-600" />

          </button>

          {/* Test Custom Frame Upload */}
          <button
            onClick={onOpenUpload}
            className="flex items-center space-x-1.5 px-3 py-2 bg-slate-900 text-white rounded-lg text-xs font-medium hover:bg-slate-800 transition-colors shadow-xs"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Test Custom Frame</span>
          </button>

        </div>

      </div>
    </header>
  );
}
