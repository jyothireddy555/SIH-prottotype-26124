import React, { useState } from 'react';
import {
  AlertTriangle,
  Flame,
  ShieldAlert,
  Info,
  Clock,
  MapPin,
  ExternalLink,
  ChevronRight,
  Filter,
  Search,
  CheckCircle2,
  Copy,
  Check
} from 'lucide-react';

export default function PriorityTable({
  alerts = [],
  selectedCategory = 'all',
  selectedIncident = null,
  onSelectIncident = () => {},
  onInspectIncident = () => {}
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('priority'); // 'priority' | 'sightings' | 'recent'
  const [copiedId, setCopiedId] = useState(null);

  const handleCopyCoords = (e, alert) => {
    e.stopPropagation();
    const text = `${alert.latitude?.toFixed(4)}°, ${alert.longitude?.toFixed(4)}°`;
    navigator.clipboard.writeText(text);
    setCopiedId(alert.id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  // Helper for priority ranking
  const getPriorityWeight = (alert) => {
    if (alert.priority_level === 'P0' || alert.alert_type === 'watchlist_match' || alert.alert_type === 'accident') return 4;
    if (alert.priority_level === 'P1' || alert.severity === 'CRITICAL') return 3;
    if (alert.priority_level === 'P2' || alert.severity === 'HIGH') return 2;
    return 1; // P3 or NORMAL / LOW
  };

  // Format time (e.g. 6:39 PM)
  const formatTime = (ts) => {
    if (!ts) return 'Just now';
    try {
      const d = new Date(ts);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'N/A';
    }
  };

  // Filter alerts by search term
  let filteredAlerts = alerts.filter((a) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (a.alert_code && a.alert_code.toLowerCase().includes(term)) ||
      (a.location_name && a.location_name.toLowerCase().includes(term)) ||
      (a.alert_type && a.alert_type.toLowerCase().includes(term)) ||
      (a.severity && a.severity.toLowerCase().includes(term))
    );
  });

  // Sort alerts
  filteredAlerts.sort((a, b) => {
    if (sortBy === 'priority') {
      return getPriorityWeight(b) - getPriorityWeight(a) || (b.sighting_count || 1) - (a.sighting_count || 1);
    }
    if (sortBy === 'sightings') {
      return (b.sighting_count || 1) - (a.sighting_count || 1);
    }
    return new Date(b.timestamp || 0) - new Date(a.timestamp || 0);
  });

  // Get Risk Badge Style
  const renderRiskBadge = (alert) => {
    const pWeight = getPriorityWeight(alert);
    if (pWeight === 4) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-extrabold bg-red-50 text-red-700 border border-red-200">
          <ShieldAlert className="w-3 h-3 text-red-600 animate-pulse" />
          P0 URGENT
        </span>
      );
    }
    if (pWeight === 3) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200">
          <Flame className="w-3 h-3 text-amber-600" />
          P1 HIGH
        </span>
      );
    }
    if (pWeight === 2) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          <AlertTriangle className="w-3 h-3 text-blue-600" />
          P2 NORMAL
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-slate-100 text-slate-700 border border-slate-200">
        <Info className="w-3 h-3 text-slate-500" />
        P3 INFO
      </span>
    );
  };

  const getCategoryTitle = () => {
    const map = {
      all: 'All Incident Stream',
      potholes: 'Potholes & Cavities',
      water_logging: 'Water Logging & Flooding',
      road_crack: 'Road Cracks & Fractures',
      damaged_road: 'Damaged Road Surface',
      missing_divider: 'Missing Divider Barriers',
      garbage: 'Roadside Garbage & Debris',
      zebra_fading: 'Zebra Crossing Fading',
      vehicle_density: 'Traffic Density Spikes',
      congestion: 'Traffic Queues & Congestion',
      overloaded_two_wheeler: 'Overloaded Two-Wheelers (>2 Pax)',
      helmet_violation: 'Helmet Safety Violations',
      rash_driving: 'Rash & Dangerous Driving',
      accident: 'Accident & Collision Incidents',
      watchlist_match: 'Watchlist Plate Intercepts'
    };
    return map[selectedCategory] || selectedCategory.replace(/_/g, ' ').toUpperCase();
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl flex flex-col h-full shadow-xs overflow-hidden">
      {/* Table Header Section */}
      <div className="p-3.5 border-b border-slate-200 bg-slate-50/70 shrink-0">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
              <span>Priority Table</span>
              <span className="text-[10px] uppercase font-mono font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-md border border-blue-200">
                {getCategoryTitle()}
              </span>
            </h2>
          </div>
          <span className="text-[11px] font-mono font-semibold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
            {filteredAlerts.length} Events
          </span>
        </div>

        {/* Search & Sort Toolbar */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by code, road, area..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-2.5 py-1 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 font-sans"
            />
          </div>

          <div className="flex items-center text-[10px] font-mono border border-slate-200 rounded-lg bg-white p-0.5">
            <button
              onClick={() => setSortBy('priority')}
              className={`px-2 py-0.5 rounded ${
                sortBy === 'priority' ? 'bg-blue-600 text-white font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Sort by Hazard Priority"
            >
              Risk
            </button>
            <button
              onClick={() => setSortBy('sightings')}
              className={`px-2 py-0.5 rounded ${
                sortBy === 'sightings' ? 'bg-blue-600 text-white font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Sort by Sightings count"
            >
              Passes
            </button>
            <button
              onClick={() => setSortBy('recent')}
              className={`px-2 py-0.5 rounded ${
                sortBy === 'recent' ? 'bg-blue-600 text-white font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Sort by Most Recent"
            >
              Time
            </button>
          </div>
        </div>
      </div>

      {/* Main Table Matching Sketch Layout */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <table className="w-full border-collapse text-left text-xs">
          <thead className="bg-slate-100/90 sticky top-0 z-10 border-b border-slate-200 text-slate-600 font-mono text-[10px] uppercase">
            <tr>
              <th className="py-2.5 pl-3 pr-1 w-10 text-center">#</th>
              <th className="py-2.5 px-2">Latitude : Longitude</th>
              <th className="py-2.5 px-2">Last viewed</th>
              <th className="py-2.5 px-2 text-center">No. of times</th>
              <th className="py-2.5 pr-3 pl-2 text-right">Risk</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredAlerts.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-400 font-medium">
                  No incidents matching the active filters.
                </td>
              </tr>
            ) : (
              filteredAlerts.map((alert, index) => {
                const isSelected = selectedIncident?.id === alert.id;
                const pWeight = getPriorityWeight(alert);

                return (
                  <tr
                    key={alert.id || alert.alert_code || index}
                    onClick={() => onSelectIncident(alert)}
                    className={`cursor-pointer transition-colors group ${
                      isSelected
                        ? 'bg-blue-50/80 hover:bg-blue-50'
                        : 'hover:bg-slate-50/80 bg-white'
                    }`}
                  >
                    {/* Column 1: (#) Circular Index Badge */}
                    <td className="py-2.5 pl-3 pr-1 text-center font-mono">
                      <span
                        className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-bold border ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                            : pWeight === 4
                            ? 'bg-red-50 text-red-700 border-red-300 font-extrabold'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {index + 1}
                      </span>
                    </td>

                    {/* Column 2: Latitude Longitude */}
                    <td className="py-2.5 px-2">
                      <div className="flex flex-col">
                        <div className="flex items-center space-x-1.5 font-mono text-[11px] font-bold text-slate-800">
                          <span>
                            {alert.latitude ? `${alert.latitude.toFixed(4)}°` : 'N/A'} :{' '}
                            {alert.longitude ? `${alert.longitude.toFixed(4)}°` : 'N/A'}
                          </span>
                          <button
                            onClick={(e) => handleCopyCoords(e, alert)}
                            className="text-slate-400 hover:text-blue-600 p-0.5 rounded transition-colors"
                            title="Copy GPS coordinates"
                          >
                            {copiedId === alert.id ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                        <span className="text-[10px] text-slate-500 truncate max-w-[140px]" title={alert.location_name}>
                          {alert.location_name || 'Urban Transit Segment'}
                        </span>
                      </div>
                    </td>

                    {/* Column 3: Last viewed */}
                    <td className="py-2.5 px-2 whitespace-nowrap">
                      <div className="flex items-center space-x-1 text-slate-600 font-mono text-[11px]">
                        <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{formatTime(alert.timestamp)}</span>
                      </div>
                      <span className="text-[9px] text-slate-400 font-mono block">
                        {alert.bus_id || 'EDGE-BUS'}
                      </span>
                    </td>

                    {/* Column 4: No. of times (Sighting count) */}
                    <td className="py-2.5 px-2 text-center whitespace-nowrap">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-md font-mono text-[11px] font-bold ${
                          (alert.sighting_count || 1) >= 20
                            ? 'bg-purple-100 text-purple-800 border border-purple-200'
                            : (alert.sighting_count || 1) >= 5
                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                        title={`Verified across ${(alert.sighting_count || 1)} observations`}
                      >
                        {alert.sighting_count || 1}
                      </span>
                    </td>

                    {/* Column 5: Risk */}
                    <td className="py-2.5 pr-3 pl-2 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-1">
                        {renderRiskBadge(alert)}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onInspectIncident(alert);
                          }}
                          className="text-slate-400 hover:text-blue-600 p-1 rounded hover:bg-slate-100 transition-colors opacity-0 group-hover:opacity-100"
                          title="Open Full Screen AI Evidence Dossier"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
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

      {/* Footer / Summary Bar */}
      <div className="p-2.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-[11px] text-slate-500 font-mono shrink-0">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Deduplicated in SQLite Edge Cache</span>
        </span>
        <button
          onClick={() => {
            if (filteredAlerts.length > 0) onInspectIncident(filteredAlerts[0]);
          }}
          className="text-blue-600 hover:text-blue-800 font-bold hover:underline flex items-center gap-0.5"
        >
          <span>Inspect Top Risk</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
