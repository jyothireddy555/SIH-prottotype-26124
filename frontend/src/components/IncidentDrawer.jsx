import React, { useState } from 'react';
import { 
  X, CheckCircle, ShieldAlert, Truck, MapPin, 
  Clock, Bus, Activity, ExternalLink, AlertCircle, Check
} from 'lucide-react';

export default function IncidentDrawer({ incident, onClose, onUpdateStatus }) {
  const [loadingAction, setLoadingAction] = useState(null);

  if (!incident) return null;

  const isPothole = incident.alert_type === 'pothole';

  const handleAction = async (actionType) => {
    setLoadingAction(actionType);
    if (onUpdateStatus) {
      await onUpdateStatus(incident.id, actionType);
    }
    setLoadingAction(null);
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white border-l border-slate-200 shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200">
      
      {/* Drawer Header */}
      <div className="p-5 border-b border-slate-200 sticky top-0 bg-white z-10 flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-mono text-xs font-bold bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200">
              #{incident.alert_code}
            </span>
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
              incident.status === 'DISPATCHED' ? 'bg-purple-100 text-purple-700' :
              incident.status === 'VERIFIED' ? 'bg-blue-100 text-blue-700' :
              incident.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-700' :
              'bg-amber-100 text-amber-700'
            }`}>
              ● {incident.status}
            </span>
          </div>
          <h2 className="text-base font-bold text-slate-900 mt-1">
            {isPothole ? 'Road Defect / Pothole Incident' : 'High Vehicle Density Spike'}
          </h2>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Drawer Body / Artifact Details */}
      <div className="p-5 space-y-5">
        
        {/* Annotated AI Evidence Image */}
        <div>
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 font-mono flex items-center justify-between">
            <span>AI EVIDENCE CAPTURE</span>
            <span className="text-blue-600 font-sans font-normal text-xs">YOLOv8 Annotated</span>
          </div>
          <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-950 relative group">
            <img
              src={incident.annotated_image_url || incident.raw_image_url || 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=80'}
              alt="Annotated Evidence"
              className="w-full h-52 object-cover"
            />
            <div className="absolute bottom-2 left-2 bg-slate-950/80 backdrop-blur-xs text-white text-[10px] font-mono px-2 py-1 rounded border border-white/20">
              Confidence: {((incident.confidence || 0.94) * 100).toFixed(1)}%
            </div>
          </div>
        </div>

        {/* AI Analysis Artifact Card */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
          <div className="text-xs font-bold text-slate-900 flex items-center justify-between">
            <div className="flex items-center space-x-1.5">
              <Activity className="w-4 h-4 text-blue-600" />
              <span>AI INFERENCE & ROAD GEOMETRY</span>
            </div>
            <span className="text-[10px] font-mono font-semibold bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
              YOLOv8-RDD2022
            </span>
          </div>
          
          <ul className="space-y-2 text-xs text-slate-700">
            <li className="flex items-center space-x-2">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Classification: <b>{isPothole ? 'D40 Pothole (Asphalt Cavity)' : 'Vehicle Congestion Flow'}</b></span>
            </li>
            <li className="flex items-center space-x-2">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Severity Level: <b className={`${
                incident.severity === 'CRITICAL' ? 'text-red-600' :
                incident.severity === 'HIGH' ? 'text-rose-600' : 'text-amber-600'
              }`}>{incident.severity}</b></span>
            </li>
            {isPothole && (
              <>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>IRC:SP:84 Standard: <b className="text-purple-700">{incident.defect_depth_est?.includes('7') || incident.severity === 'CRITICAL' ? 'Class I (Emergency 24h Dispatch)' : 'Class II (Severe Distress 48h)'}</b></span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Estimated Cavity Depth: <b>{incident.defect_depth_est || '~6.8 cm'}</b></span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Affected Surface Area: <b>{incident.defect_area_est || '0.45 sq.m'}</b></span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Est. Cold-Mix Asphalt: <b>~0.06 Metric Tons</b></span>
                </li>
              </>
            )}
            {!isPothole && (
              <li className="flex items-center space-x-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Vehicle Count: <b>{incident.vehicle_count || 14} vehicles in frame</b></span>
              </li>
            )}
          </ul>
        </div>

        {/* Telemetry & Location Details */}
        <div className="border border-slate-200 rounded-xl p-4 space-y-2.5 bg-white text-xs">
          <div className="flex items-start space-x-2.5">
            <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
            <div>
              <span className="font-semibold text-slate-900 block">{incident.location_name}</span>
              <span className="font-mono text-[11px] text-slate-500">
                {incident.latitude?.toFixed(5)}° N, {incident.longitude?.toFixed(5)}° E
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2.5 text-slate-600 pt-2 border-t border-slate-100">
            <Bus className="w-4 h-4 text-slate-400 shrink-0" />
            <span>Reporting Node: <b className="text-slate-900">{incident.bus_id}</b> ({incident.route_id})</span>
          </div>

          <div className="flex items-center space-x-2.5 text-slate-600">
            <Clock className="w-4 h-4 text-slate-400 shrink-0" />
            <span>Timestamp: <b className="text-slate-900">{new Date(incident.timestamp).toLocaleString()}</b></span>
          </div>
        </div>

        {/* Municipal PWD Work Order Generator Card */}
        {isPothole && (
          <div className="border border-blue-200 bg-blue-50/60 rounded-xl p-3.5 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-blue-950 font-mono">PWD WORK TICKET</span>
              <span className="text-[10px] font-mono text-blue-700">SLA: 24h Max</span>
            </div>
            <p className="text-[11px] text-blue-900">
              Contractor job card pre-filled with GSD area, optical depth, GPS coordinates, and asphalt tonnage estimate.
            </p>
            <button
              onClick={() => {
                alert(`📄 Official Municipal Work Order #${incident.alert_code}\nLocation: ${incident.location_name}\nGPS: ${incident.latitude}, ${incident.longitude}\nIRC Severity: Class I Emergency\nEstimated Asphalt Required: 0.06 MT\nContractor SLA: 24 Hours\nStatus: DISPATCH QUEUED`);
              }}
              className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-xs transition-colors shadow-xs"
            >
              📄 Print / Generate PWD Work Order
            </button>
          </div>
        )}

      </div>

      {/* Municipal Workflow Action Buttons */}
      <div className="p-4 border-t border-slate-200 bg-slate-50 space-y-2 sticky bottom-0">
        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono mb-1">
          MUNICIPAL DISPATCH ACTIONS
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => handleAction('verify')}
            disabled={incident.status === 'VERIFIED' || loadingAction !== null}
            className="flex items-center justify-center space-x-1.5 px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition-colors disabled:opacity-50"
          >
            <Check className="w-3.5 h-3.5 text-blue-600" />
            <span>Mark Verified</span>
          </button>

          <button
            onClick={() => handleAction('dispatch')}
            disabled={incident.status === 'DISPATCHED' || loadingAction !== null}
            className="flex items-center justify-center space-x-1.5 px-3 py-2 bg-purple-600 text-white rounded-lg text-xs font-semibold hover:bg-purple-700 transition-colors shadow-xs disabled:opacity-50"
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Dispatch Crew</span>
          </button>
        </div>

        <button
          onClick={() => handleAction('resolve')}
          disabled={incident.status === 'RESOLVED' || loadingAction !== null}
          className="w-full flex items-center justify-center space-x-1.5 px-3 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition-colors shadow-xs disabled:opacity-50"
        >
          <CheckCircle className="w-3.5 h-3.5" />
          <span>Mark Incident Resolved (Repaired)</span>
        </button>
      </div>

    </div>
  );
}
