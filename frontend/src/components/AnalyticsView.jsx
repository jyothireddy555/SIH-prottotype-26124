import React from 'react';
import { 
  BarChart3, TrendingUp, AlertTriangle, ShieldCheck, 
  MapPin, CheckCircle, Clock, Truck, Activity
} from 'lucide-react';

export default function AnalyticsView({ stats, alerts = [] }) {
  const potholes = alerts.filter(a => a.alert_type === 'pothole');
  const traffic = alerts.filter(a => a.alert_type === 'vehicle_density');

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto overflow-y-auto">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Urban Transit Intelligence Analytics</h1>
          <p className="text-xs text-slate-500">Municipal Road Quality Index & Traffic Flow Telemetry</p>
        </div>
        <div className="flex items-center space-x-2 text-xs font-mono">
          <span className="px-2.5 py-1 rounded-md bg-blue-50 border border-blue-200 text-blue-700 font-bold">
            Corridor: Pune Transit Sector 4
          </span>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Road Quality Index</span>
            <ShieldCheck className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">
            {stats?.road_health_index || 88.5} <span className="text-xs text-slate-400 font-normal">/ 100</span>
          </div>
          <div className="text-[11px] text-slate-500">
            Penalized by {stats?.critical_severity_count || 0} critical road defects
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Total AI Detections</span>
            <Activity className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">
            {stats?.total_alerts || 0}
          </div>
          <div className="text-[11px] text-emerald-600 font-medium">
            Avg Confidence: {((stats?.avg_confidence || 0.94) * 100).toFixed(1)}%
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Potholes & Cavities</span>
            <AlertTriangle className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-2xl font-bold text-red-600 font-mono">
            {stats?.total_potholes || 0}
          </div>
          <div className="text-[11px] text-slate-500">
            {stats?.critical_severity_count || 0} Critical · {stats?.high_severity_count || 0} High
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Maintenance Dispatched</span>
            <Truck className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-purple-700 font-mono">
            {stats?.dispatched_incidents || 0}
          </div>
          <div className="text-[11px] text-slate-500">
            {stats?.open_incidents || 0} Open in Queue
          </div>
        </div>

      </div>

      {/* Analytics Charts & Corridors Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Defect Severity Breakdown */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase font-mono tracking-wider">
            ROAD DEFECT SEVERITY DISTRIBUTION
          </h2>
          <div className="space-y-3">
            {[
              { label: 'Critical Severity (Immediate Hazard)', count: stats?.severity_breakdown?.CRITICAL || 0, color: 'bg-red-600', text: 'text-red-700' },
              { label: 'High Severity (Deep Depression)', count: stats?.severity_breakdown?.HIGH || 0, color: 'bg-rose-500', text: 'text-rose-700' },
              { label: 'Medium Severity (Moderate Wear)', count: stats?.severity_breakdown?.MEDIUM || 0, color: 'bg-amber-500', text: 'text-amber-700' },
              { label: 'Low Severity (Surface Fracture)', count: stats?.severity_breakdown?.LOW || 0, color: 'bg-blue-500', text: 'text-blue-700' }
            ].map((item) => {
              const total = stats?.total_alerts || 1;
              const pct = Math.round((item.count / total) * 100);
              return (
                <div key={item.label} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-700">{item.label}</span>
                    <span className={`font-mono font-bold ${item.text}`}>{item.count} ({pct}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div className={`${item.color} h-2 rounded-full transition-all`} style={{ width: `${Math.max(pct, 4)}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top High-Risk Corridors */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase font-mono tracking-wider">
            TOP HIGH-RISK ROAD CORRIDORS
          </h2>
          <div className="space-y-2.5">
            {(stats?.top_corridors || []).map((corridor, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                <div className="flex items-center space-x-2.5">
                  <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 font-mono font-bold flex items-center justify-center text-[10px]">
                    {idx + 1}
                  </span>
                  <span className="font-semibold text-slate-900">{corridor.corridor}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="bg-red-50 text-red-700 font-bold px-2 py-0.5 rounded border border-red-200 font-mono">
                    {corridor.incidents} defects
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
