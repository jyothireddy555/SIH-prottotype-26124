import React from 'react';
import { X, Bus, MapPin, Activity, Video, Gauge, Radio, ShieldCheck } from 'lucide-react';

export default function BusDetailDrawer({ bus, onClose, alerts = [] }) {
  if (!bus) return null;

  const busAlerts = alerts.filter(a => a.bus_id === bus.bus_label);

  return (
    <>
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/20 backdrop-blur-[1px] z-[9998] transition-opacity"
      />
      <div className="fixed inset-y-0 right-0 z-[9999] w-full max-w-md bg-white border-l border-slate-200 shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200">
      
      {/* Header */}
      <div className="p-5 border-b border-slate-200 sticky top-0 bg-white z-10 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
            <Bus className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-bold text-slate-900">{bus.bus_label}</h2>
              <span className="text-[10px] font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                {bus.bus_number}
              </span>
            </div>
            <span className="text-xs text-emerald-700 font-medium flex items-center space-x-1 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>AI Edge Sensing Node Active</span>
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Body */}
      <div className="p-5 space-y-5">
        
        {/* Transit Corridor Card */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">
            ASSIGNED TRANSIT CORRIDOR
          </div>
          <div className="text-sm font-bold text-slate-900">{bus.route_name}</div>
          <div className="text-xs text-slate-500 font-mono">Route Code: {bus.route_id}</div>
        </div>

        {/* Live Telemetry Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="border border-slate-200 rounded-xl p-3 bg-white space-y-1">
            <div className="flex items-center space-x-1.5 text-slate-400 text-xs">
              <Gauge className="w-3.5 h-3.5" />
              <span>Speed</span>
            </div>
            <div className="text-lg font-bold text-slate-900 font-mono">{bus.speed_kmh} <span className="text-xs font-normal text-slate-500">km/h</span></div>
          </div>

          <div className="border border-slate-200 rounded-xl p-3 bg-white space-y-1">
            <div className="flex items-center space-x-1.5 text-slate-400 text-xs">
              <Video className="w-3.5 h-3.5" />
              <span>Cam Health</span>
            </div>
            <div className="text-lg font-bold text-emerald-600 font-mono">1080p <span className="text-xs font-normal text-slate-500">30fps</span></div>
          </div>
        </div>

        {/* Today's Detection Stats */}
        <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-3">
          <div className="text-xs font-bold text-slate-900 uppercase font-mono tracking-wider">
            TODAY'S AI OBSERVATIONS
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
              <div className="text-base font-bold text-slate-900 font-mono">{bus.total_detections}</div>
              <div className="text-[10px] text-slate-500">Total Detections</div>
            </div>
            <div className="bg-red-50 p-2.5 rounded-lg border border-red-100">
              <div className="text-base font-bold text-red-700 font-mono">{bus.total_potholes}</div>
              <div className="text-[10px] text-red-600">Potholes</div>
            </div>
            <div className="bg-amber-50 p-2.5 rounded-lg border border-amber-100">
              <div className="text-base font-bold text-amber-700 font-mono">{bus.total_vehicles}</div>
              <div className="text-[10px] text-amber-600">Vehicles</div>
            </div>
          </div>
        </div>

        {/* Recent Detections by this Bus */}
        <div className="space-y-2.5">
          <div className="text-xs font-bold text-slate-900 uppercase font-mono tracking-wider">
            RECENT INCIDENTS REPORTED
          </div>
          {busAlerts.length === 0 && (
            <div className="text-xs text-slate-400 p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
              No critical incidents reported on current corridor run.
            </div>
          )}
          {busAlerts.slice(0, 5).map((al) => (
            <div key={al.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-slate-900">#{al.alert_code}</span> · <span className="capitalize">{al.alert_type}</span>
                <div className="text-[11px] text-slate-500">{al.location_name}</div>
              </div>
              <span className="font-mono text-red-600 font-bold bg-white px-2 py-0.5 rounded border border-red-200">
                {al.severity}
              </span>
            </div>
          ))}
        </div>

      </div>

      {/* Footer */}
      <div className="p-4 border-t border-slate-200 bg-slate-50 text-[11px] text-slate-500 flex items-center justify-between">
        <span>Hardware: NVIDIA Jetson / Edge GPU</span>
        <span className="font-mono text-slate-700">Ping: 12ms</span>
      </div>

    </div>
    </>
  );
}
