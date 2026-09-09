import React, { useState } from 'react';
import {
  ShieldAlert,
  Flame,
  Info,
  Clock,
  MapPin,
  ExternalLink,
  Search,
  CheckCircle2,
  Copy,
  Check,
  ChevronRight,
  Filter
} from 'lucide-react';

export default function PriorityTable({
  alerts = [],
  selectedCategory = 'all',
  selectedIncident = null,
  onSelectIncident = () => {},
  onInspectIncident = () => {}
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState('ALL'); // 'ALL' | 'P0' | 'P1' | 'MULTIPASS'
  const [copiedId, setCopiedId] = useState(null);

  const handleCopyCoords = (e, alert) => {
    e.stopPropagation();
    const text = `${alert.latitude?.toFixed(4)}°, ${alert.longitude?.toFixed(4)}°`;
    navigator.clipboard.writeText(text);
    setCopiedId(alert.id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const getPriorityWeight = (alert) => {
    if (alert.priority_level === 'P0' || alert.alert_type === 'watchlist_match' || alert.alert_type === 'accident') return 4;
    if (alert.priority_level === 'P1' || alert.severity === 'CRITICAL') return 3;
    if (alert.priority_level === 'P2' || alert.severity === 'HIGH') return 2;
    return 1;
  };

  const formatTime = (ts) => {
    if (!ts) return 'Just now';
    try {
      const d = new Date(ts);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'N/A';
    }
  };

  // 1. Filter by category
  let filtered = alerts.filter((a) => {
    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'road' || selectedCategory === 'all_road') {
      return ['pothole', 'water_logging', 'road_crack', 'road_damage', 'garbage', 'missing_divider', 'zebra_fading'].includes(a.alert_type);
    }
    if (selectedCategory === 'traffic' || selectedCategory === 'all_traffic') {
      return ['vehicle_density', 'congestion'].includes(a.alert_type);
    }
    if (selectedCategory === 'safety' || selectedCategory === 'all_safety') {
      return ['overloaded_two_wheeler', 'helmet_violation', 'rash_driving', 'accident', 'watchlist_match'].includes(a.alert_type);
    }
    if (selectedCategory === 'potholes' || selectedCategory === 'pothole') return a.alert_type === 'pothole';
    if (selectedCategory === 'water_logging') return a.alert_type === 'water_logging';
    if (selectedCategory === 'missing_divider') return a.alert_type === 'missing_divider';
    if (selectedCategory === 'damaged_road' || selectedCategory === 'road_crack') return ['road_crack', 'road_damage'].includes(a.alert_type);
    if (selectedCategory === 'garbage') return a.alert_type === 'garbage';
    if (selectedCategory === 'zebra_fading') return a.alert_type === 'zebra_fading';
    if (selectedCategory === 'congestion') return a.alert_type === 'congestion';
    if (selectedCategory === 'vehicle_density') return a.alert_type === 'vehicle_density';
    if (selectedCategory === 'overloaded_two_wheeler') return a.alert_type === 'overloaded_two_wheeler';
    if (selectedCategory === 'helmet_violation') return a.alert_type === 'helmet_violation';
    if (selectedCategory === 'accident' || selectedCategory === 'rash_driving') return ['accident', 'rash_driving'].includes(a.alert_type);
    if (selectedCategory === 'watchlist_match') return a.alert_type === 'watchlist_match';
    return a.alert_type === selectedCategory;
  });

  // 2. Filter by risk tab
  if (riskFilter === 'P0') {
    filtered = filtered.filter((a) => a.priority_level === 'P0' || a.alert_type === 'watchlist_match' || a.alert_type === 'accident');
  } else if (riskFilter === 'P1') {
    filtered = filtered.filter((a) => a.priority_level === 'P1' || a.severity === 'CRITICAL');
  } else if (riskFilter === 'MULTIPASS') {
    filtered = filtered.filter((a) => (a.sighting_count || 1) >= 2);
  }

  // 3. Filter by search term
  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    filtered = filtered.filter((a) =>
      (a.alert_code && a.alert_code.toLowerCase().includes(term)) ||
      (a.location_name && a.location_name.toLowerCase().includes(term)) ||
      (a.alert_type && a.alert_type.toLowerCase().includes(term))
    );
  }

  // Sort by priority weight desc, then sightings desc
  filtered.sort((a, b) => {
    return getPriorityWeight(b) - getPriorityWeight(a) || (b.sighting_count || 1) - (a.sighting_count || 1);
  });

  const renderRiskBadge = (alert) => {
    const pWeight = getPriorityWeight(alert);
    if (pWeight === 4) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold bg-red-100 text-red-700 border border-red-200">
          <ShieldAlert className="w-3 h-3 text-red-600 animate-pulse" />
          P0 URGENT
        </span>
      );
    }
    if (pWeight === 3) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-100 text-amber-800 border border-amber-200">
          <Flame className="w-3 h-3 text-amber-600" />
          P1 HIGH
        </span>
      );
    }
    if (pWeight === 2) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          P2 NORMAL
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono bg-slate-100 text-slate-600 border border-slate-200">
        P3 INFO
      </span>
    );
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl flex flex-col h-full shadow-xs overflow-hidden">
      {/* 1. TABLE HEADER & CONTROLS */}
      <div className="p-3.5 border-b border-slate-200 bg-slate-50/60 shrink-0 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Priority Incident Table</span>
            <span className="text-[10px] font-mono font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200">
              {filtered.length} Events
            </span>
          </h2>

          {/* Risk Filter Segmented Tabs */}
          <div className="flex items-center bg-slate-200/80 p-0.5 rounded-lg text-xs font-mono">
            {['ALL', 'P0', 'P1', 'MULTIPASS'].map((rf) => (
              <button
                key={rf}
                onClick={() => setRiskFilter(rf)}
                className={`px-2 py-0.5 rounded-md font-bold transition-all cursor-pointer ${
                  riskFilter === rf
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {rf === 'MULTIPASS' ? 'Multi-Pass' : rf}
              </button>
            ))}
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by code, defect, corridor area..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 font-sans shadow-2xs"
          />
        </div>
      </div>

      {/* 2. TABLE BODY (No horizontal scroll) */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
        <table className="w-full table-fixed border-collapse text-left text-xs">
          <thead className="bg-slate-100/90 sticky top-0 z-10 border-b border-slate-200 text-slate-500 font-mono text-[9px] uppercase tracking-wider">
            <tr>
              <th className="py-2 pl-2 pr-1 w-10 text-center">Index</th>
              <th className="py-2 px-1 text-left">Hazard & Location</th>
              <th className="py-2 px-1 w-28 text-left">GPS</th>
              <th className="py-2 px-1 w-16 text-center">Multi-Pass</th>
              <th className="py-2 pr-2 pl-1 w-20 text-right">Risk Tag</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-400 font-medium">
                  No incidents matching active criteria.
                </td>
              </tr>
            ) : (
              filtered.map((alert, index) => {
                const isSelected = selectedIncident?.id === alert.id;
                const pWeight = getPriorityWeight(alert);
                const indexStr = index + 1 < 10 ? `0${index + 1}` : `${index + 1}`;

                return (
                  <tr
                    key={alert.id || alert.alert_code || index}
                    onClick={() => onSelectIncident(alert)}
                    className={`cursor-pointer transition-colors group ${
                      isSelected
                        ? 'bg-blue-50/80 hover:bg-blue-50'
                        : 'hover:bg-slate-50 bg-white'
                    }`}
                  >
                    {/* Column 1: Index Badge */}
                    <td className="py-2 pl-2 pr-1 text-center font-mono align-middle">
                      <span
                        className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold border ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-700 shadow-2xs'
                            : pWeight === 4
                            ? 'bg-red-500 text-white font-extrabold shadow-2xs'
                            : pWeight === 3
                            ? 'bg-amber-500 text-white font-bold'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {indexStr}
                      </span>
                    </td>

                    {/* Column 2: Hazard Name & Location */}
                    <td className="py-2 px-1 align-middle overflow-hidden">
                      <div className="flex flex-col min-w-0">
                        <span className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors uppercase text-[10px] truncate">
                          {alert.alert_type?.replace(/_/g, ' ')}
                        </span>
                        <span className="text-[9px] text-slate-500 truncate block w-full" title={alert.location_name}>
                          {alert.location_name || 'Transit Segment'}
                        </span>
                      </div>
                    </td>

                    {/* Column 3: GPS Coordinates */}
                    <td className="py-2 px-1 align-middle overflow-hidden">
                      <div className="flex items-center space-x-0.5 font-mono text-[10px] text-slate-600 min-w-0">
                        <span className="truncate">
                          {alert.latitude?.toFixed(3)}, {alert.longitude?.toFixed(3)}
                        </span>
                        <button
                          onClick={(e) => handleCopyCoords(e, alert)}
                          className="text-slate-400 hover:text-blue-600 p-0.5 rounded transition-colors shrink-0"
                          title="Copy GPS coordinates"
                        >
                          {copiedId === alert.id ? (
                            <Check className="w-2.5 h-2.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-2.5 h-2.5" />
                          )}
                        </button>
                      </div>
                    </td>

                    {/* Column 4: Multi-Pass Verification */}
                    <td className="py-2 px-1 text-center align-middle">
                      <span
                        className={`inline-block px-1.5 py-0.5 rounded font-mono text-[10px] font-bold ${
                          (alert.sighting_count || 1) >= 5
                            ? 'bg-purple-100 text-purple-800 border border-purple-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                        title={`Verified across ${alert.sighting_count || 1} observations`}
                      >
                        {alert.sighting_count || 1}x
                      </span>
                    </td>

                    {/* Column 5: Risk Tag */}
                    <td className="py-2 pr-2 pl-1 text-right align-middle">
                      <div className="flex items-center justify-end space-x-1">
                        {renderRiskBadge(alert)}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onInspectIncident(alert);
                          }}
                          className="text-slate-400 hover:text-blue-600 p-0.5 rounded hover:bg-slate-100 transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                          title="Open Full AI Evidence Dossier"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 3. FOOTER ACTIONS */}
      <div className="p-2.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-[11px] text-slate-500 font-mono shrink-0">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Deduplicated in SQLite Edge Cache</span>
        </span>
        <button
          onClick={() => {
            if (filtered.length > 0) onInspectIncident(filtered[0]);
          }}
          className="text-blue-600 hover:text-blue-800 font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
        >
          <span>Inspect Top Risk</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
