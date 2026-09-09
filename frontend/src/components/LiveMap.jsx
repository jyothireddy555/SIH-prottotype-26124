import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';
import {
  Layers,
  Flame,
  Maximize2,
  Minimize2,
  Target,
  Check,
  Route,
  Eye,
  EyeOff,
} from 'lucide-react';

// === SIH GIS HEATMAP MODES ===
export const HEATMAP_MODES = {
  violations: {
    id: 'violations',
    label: 'Traffic Violations',
    icon: '🚦',
    title: 'Traffic Violation Hotspots',
    desc: 'Concentration of AI-detected violations from mobile buses.',
    scale: 1.0,
    types: ['overloaded_two_wheeler', 'helmet_violation', 'rash_driving'],
  },
  triple: {
    id: 'triple',
    label: 'Triple Riding',
    icon: '🏍️',
    title: 'Triple-Riding Hotspots',
    desc: 'Locations where repeated triple-riding detections occur.',
    scale: 0.85,
    types: ['overloaded_two_wheeler'],
  },
  helmet: {
    id: 'helmet',
    label: 'No Helmet',
    icon: '🪖',
    title: 'No-Helmet Hotspots',
    desc: 'Road segments with frequent helmet violations.',
    scale: 0.9,
    types: ['helmet_violation'],
  },
  congestion: {
    id: 'congestion',
    label: 'Congestion',
    icon: '🚗',
    title: 'Congestion Hotspots',
    desc: 'Areas showing repeated low-speed / high-density traffic.',
    scale: 0.75,
    types: ['vehicle_density', 'congestion'],
  },
  risk: {
    id: 'risk',
    label: 'Road Safety Risk',
    icon: '⚠️',
    title: 'Road Safety Risk',
    desc: 'Combined score from violations, accidents, congestion and road deficiencies.',
    scale: 1.15,
    types: ['pothole', 'water_logging', 'road_crack', 'missing_divider', 'accident', 'watchlist_match', 'helmet_violation', 'overloaded_two_wheeler', 'congestion', 'vehicle_density'],
  },
  accident: {
    id: 'accident',
    label: 'Accident Hotspots',
    icon: '💥',
    title: 'Accident Hotspots',
    desc: 'Historical and AI-detected incident concentration.',
    scale: 0.7,
    types: ['accident', 'watchlist_match'],
  },
};

// Fix default Leaflet icon paths
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// === MAP TILE STYLES ===
export const MAP_STYLES = {
  voyager: {
    id: 'voyager',
    name: 'Daylight',
    icon: '☀️',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution: '&copy; CartoDB &amp; OpenStreetMap',
    isDark: false,
  },
  dark: {
    id: 'dark',
    name: 'Night',
    icon: '🌙',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; CartoDB Dark Matter',
    isDark: true,
  },
  satellite: {
    id: 'satellite',
    name: 'Satellite',
    icon: '🛰️',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri World Imagery',
    isDark: true,
  },
  positron: {
    id: 'positron',
    name: 'Minimal',
    icon: '📄',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; CartoDB Positron',
    isDark: false,
  },
  topo: {
    id: 'topo',
    name: 'Terrain',
    icon: '⛰️',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri Topo Map',
    isDark: false,
  },
  osm: {
    id: 'osm',
    name: 'OpenStreetMap',
    icon: '🗺️',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
    isDark: false,
  },
};

// === ALERT TYPE CONFIG ===
const ALERT_CONFIG = {
  watchlist_match:       { emoji: '🚨', color: '#DC2626', priority: 0 },
  accident:              { emoji: '💥', color: '#EF4444', priority: 0 },
  overloaded_two_wheeler:{ emoji: '🛵', color: '#B91C1C', priority: 1 },
  helmet_violation:      { emoji: '⛑️', color: '#D97706', priority: 1 },
  vehicle_density:       { emoji: '🚗', color: '#F59E0B', priority: 2 },
  congestion:            { emoji: '🔴', color: '#EA580C', priority: 2 },
  pothole:               { emoji: '🕳️', color: '#7C3AED', priority: 2 },
  water_logging:         { emoji: '🌊', color: '#2563EB', priority: 2 },
  road_crack:            { emoji: '⚡', color: '#9333EA', priority: 2 },
  missing_divider:       { emoji: '🚧', color: '#CA8A04', priority: 3 },
  zebra_fading:          { emoji: '🦓', color: '#A16207', priority: 3 },
  garbage:               { emoji: '🗑️', color: '#65A30D', priority: 3 },
};

// === BEARING CALC ===
export function calculateBearing(startLat, startLng, endLat, endLng) {
  if (startLat === endLat && startLng === endLng) return 0;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLng = toRad(endLng - startLng);
  const y = Math.sin(dLng) * Math.cos(toRad(endLat));
  const x =
    Math.cos(toRad(startLat)) * Math.sin(toRad(endLat)) -
    Math.sin(toRad(startLat)) * Math.cos(toRad(endLat)) * Math.cos(dLng);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

// === POSITION INTERPOLATION ===
export function getInterpolatedStateAlongRoute(coords, progress) {
  if (!coords || coords.length === 0) return { position: [17.4435, 78.3772], bearing: 0, segmentIndex: 0 };
  if (coords.length === 1) return { position: coords[0], bearing: 0, segmentIndex: 0 };
  const p = Math.max(0, Math.min(progress, 0.99999));
  const scaledIndex = p * (coords.length - 1);
  const segmentIdx = Math.floor(scaledIndex);
  const segFrac = scaledIndex - segmentIdx;
  const p1 = coords[segmentIdx];
  const p2 = coords[Math.min(segmentIdx + 1, coords.length - 1)];
  const lat = p1[0] + (p2[0] - p1[0]) * segFrac;
  const lng = p1[1] + (p2[1] - p1[1]) * segFrac;
  const bearing = calculateBearing(p1[0], p1[1], p2[0], p2[1]);
  return { position: [lat, lng], bearing, segmentIndex: segmentIdx };
}

export function interpolatePositionAlongRoute(coords, progress) {
  return getInterpolatedStateAlongRoute(coords, progress).position;
}

// === BUS ICON — Detailed top-down transit bus with AI camera sensor ===
const createBusIcon = (label, speed, isMoving, isActive, bearing = 0) => {
  const isHyd = label.startsWith('HYD');
  const baseColor = isHyd
    ? '#10B981'
    : label === 'BUS-218'
    ? '#6366F1'
    : label === 'BUS-301'
    ? '#8B5CF6'
    : '#3B82F6';
  
  const ringGlow = isActive
    ? `filter: drop-shadow(0 0 10px ${baseColor});`
    : 'filter: drop-shadow(0 2px 6px rgba(0,0,0,0.4));';
  const pulse = isMoving ? 'animation:pulse-bus 2s ease-in-out infinite;' : '';

  return L.divIcon({
    className: '',
    html: `
      <div style="display:flex;flex-direction:column;align-items:center;gap:4px;cursor:pointer;">
        <!-- Vehicle Body Container with Directional Rotation -->
        <div style="
          transform:rotate(${bearing}deg);
          transition:transform 0.4s ease;
          ${ringGlow}${pulse}
          display:flex;align-items:center;justify-content:center;
        ">
          <svg width="34" height="54" viewBox="0 0 34 54" fill="none" xmlns="http://www.w3.org/2000/svg">
            <!-- Headlight Cone / Sensor Field -->
            <path d="M17 2 L3 22 H31 L17 2 Z" fill="${baseColor}" opacity="0.22"/>
            
            <!-- Bus Body Shadow -->
            <rect x="5" y="8" width="24" height="42" rx="6" fill="rgba(0,0,0,0.35)"/>
            
            <!-- Main Bus Chassis -->
            <rect x="4" y="6" width="26" height="42" rx="6" fill="${baseColor}" stroke="white" stroke-width="2"/>
            
            <!-- Front Windshield -->
            <rect x="7" y="9" width="20" height="8" rx="2" fill="#0F172A"/>
            <rect x="8" y="10" width="18" height="6" rx="1" fill="#38BDF8" opacity="0.85"/>
            
            <!-- Roof AI Edge-Sensing Camera Pod -->
            <rect x="11" y="21" width="12" height="15" rx="3" fill="white"/>
            <rect x="13" y="23" width="8" height="11" rx="2" fill="#1E293B"/>
            <circle cx="17" cy="28" r="3" fill="#38BDF8"/>
            <circle cx="17" cy="28" r="1.2" fill="white"/>
            
            <!-- Side Windows -->
            <rect x="5" y="19" width="1.5" height="20" rx="0.5" fill="#0F172A"/>
            <rect x="27.5" y="19" width="1.5" height="20" rx="0.5" fill="#0F172A"/>
            
            <!-- Rear Windshield & Brake Lights -->
            <rect x="7" y="42" width="20" height="3" rx="1" fill="#0F172A"/>
            <rect x="5.5" y="45" width="4" height="2" rx="0.5" fill="#EF4444"/>
            <rect x="24.5" y="45" width="4" height="2" rx="0.5" fill="#EF4444"/>
          </svg>
        </div>
        
        <!-- Label Badge -->
        <div style="
          background:${baseColor};
          color:white;
          font-size:9px;
          font-weight:800;
          font-family:monospace;
          padding:2px 7px;
          border-radius:5px;
          white-space:nowrap;
          box-shadow:0 2px 6px rgba(0,0,0,0.4);
          letter-spacing:0.5px;
          border:1px solid rgba(255,255,255,0.4);
        ">
          ${label} ${isMoving ? `<span style="opacity:0.85;margin-left:3px;">${speed}k</span>` : ''}
        </div>
      </div>
    `,
    iconSize: [38, 70],
    iconAnchor: [19, 35],
    popupAnchor: [0, -38],
  });
};

// === INCIDENT ICON — clean dot with emoji, no text label ===
const createIncidentIcon = (alert) => {
  const cfg = ALERT_CONFIG[alert.alert_type] || { emoji: '⚠️', color: '#94A3B8', priority: 3 };
  const isP0 = cfg.priority === 0;
  const size = isP0 ? 32 : 26;
  const half = size / 2;
  const pulse = isP0
    ? `animation:incident-pulse 1.6s ease-in-out infinite;`
    : '';

  return L.divIcon({
    className: '',
    html: `
      <div style="
        width:${size}px;height:${size}px;
        border-radius:50%;
        background:${cfg.color};
        border:2px solid white;
        display:flex;align-items:center;justify-content:center;
        box-shadow:0 2px 8px ${cfg.color}88;
        ${pulse}
        cursor:pointer;
      ">
        <span style="font-size:${isP0 ? 14 : 11}px;line-height:1;">${cfg.emoji}</span>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [half, half],
    popupAnchor: [0, -(half + 4)],
  });
};

// === MAP UPDATER ===
function MapUpdater({ lat, lng, isMoving, selectedIncident, activeCity, centerOnBusSignal }) {
  const map = useMap();
  const prevCityRef = useRef(activeCity);

  useEffect(() => {
    if (prevCityRef.current !== activeCity) {
      prevCityRef.current = activeCity;
      if (activeCity === 'hyderabad') map.flyTo([17.4435, 78.3772], 13, { duration: 1.5 });
      else map.flyTo([18.5380, 73.7850], 13, { duration: 1.5 });
      return;
    }
    if (selectedIncident?.latitude && selectedIncident?.longitude) {
      map.flyTo([selectedIncident.latitude, selectedIncident.longitude], 16, { duration: 1.2 });
    } else if (lat && lng && (isMoving || centerOnBusSignal)) {
      map.panTo([lat, lng], { animate: true, duration: 0.8 });
    }
  }, [lat, lng, isMoving, selectedIncident, activeCity, map, centerOnBusSignal]);

  return null;
}

// === HYDERABAD & PUNE OSRM ROAD GEOMETRY COORDS ===
import osrmRoutes from './osrm_routes.json';

export const route216Coords = osrmRoutes.route216 || [];
export const route10HCoords = osrmRoutes.route10H || [];
export const route5KCoords = osrmRoutes.route5K || [];
export const route115Coords = osrmRoutes.route115 || [];
export const route500DCoords = osrmRoutes.route500D || [];
export const route335ECoords = osrmRoutes.route335E || [];

// Route display config
const ROUTE_DISPLAY = {
  'HYD-101': { coords: route216Coords, color: '#10B981', label: 'Route 216' },
  'HYD-204': { coords: route10HCoords, color: '#0EA5E9', label: 'Route 10H' },
  'HYD-305': { coords: route5KCoords,  color: '#8B5CF6', label: 'Route 5K'  },
  'BUS-104': { coords: route115Coords, color: '#3B82F6', label: 'Route 115' },
  'BUS-218': { coords: route500DCoords,color: '#6366F1', label: 'Route 500D'},
  'BUS-301': { coords: route335ECoords,color: '#A855F7', label: 'Route 335E'},
};

// Route groups per city
const HYD_BUS_IDS = ['HYD-101', 'HYD-204', 'HYD-305'];
const PUNE_BUS_IDS = ['BUS-104', 'BUS-218', 'BUS-301'];

// === LEAFLET HEATMAP LAYER COMPONENT ===
function LeafletHeatmapLayer({ points, showHeatmap }) {
  const map = useMap();
  const heatLayerRef = useRef(null);

  useEffect(() => {
    if (!map) return;

    if (heatLayerRef.current) {
      try {
        map.removeLayer(heatLayerRef.current);
      } catch (e) {
        // ignore
      }
      heatLayerRef.current = null;
    }

    if (!showHeatmap || !points || points.length === 0) return;

    try {
      if (typeof L.heatLayer === 'function') {
        const heat = L.heatLayer(points, {
          radius: 30,
          blur: 20,
          minOpacity: 0.22,
          maxZoom: 15,
          gradient: {
            0.15: '#2ee6a6',
            0.4: '#ffe66d',
            0.65: '#ff8a3d',
            1.0: '#ff3b4f',
          },
        });
        heat.addTo(map);
        heatLayerRef.current = heat;
      }
    } catch (err) {
      console.error('Heatmap creation error:', err);
    }

    return () => {
      if (heatLayerRef.current && map) {
        try {
          map.removeLayer(heatLayerRef.current);
        } catch (e) {
          // ignore
        }
        heatLayerRef.current = null;
      }
    };
  }, [map, points, showHeatmap]);

  return null;
}

// =====================================================================
export default function LiveMap({
  activeCity = 'hyderabad',
  selectedCategory = 'all',
  alerts = [],
  buses = [],
  activeBus,
  isPlaying = false,
  videoProgress = 0,
  selectedIncident = null,
  onSelectAlert,
  onSelectBus,
}) {
  const [activeMapStyle, setActiveMapStyle] = useState('voyager');
  const [showStyleMenu, setShowStyleMenu] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [activeHeatmapMode, setActiveHeatmapMode] = useState('violations');
  const [showAllRoutes, setShowAllRoutes] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [centerSignal, setCenterSignal] = useState(0);
  const mapContainerRef = useRef(null);

  const mapStyleConfig = MAP_STYLES[activeMapStyle] || MAP_STYLES.voyager;
  const activeModeConfig = HEATMAP_MODES[activeHeatmapMode] || HEATMAP_MODES.violations;
  const cityCenter = activeCity === 'hyderabad' ? [17.4435, 78.3772] : [18.5380, 73.7850];
  const cityBusIds = activeCity === 'hyderabad' ? HYD_BUS_IDS : PUNE_BUS_IDS;

  // Target bus & route (prioritize selected incident's bus or active selected bus)
  const targetBusId = selectedIncident?.bus_id || activeBus?.bus_label || (activeCity === 'hyderabad' ? 'HYD-101' : 'BUS-104');
  const activeRouteInfo = ROUTE_DISPLAY[targetBusId] || ROUTE_DISPLAY['HYD-101'];
  const activeRouteCoords = activeRouteInfo.coords;

  // Interpolated bus position along active route
  const routeState = getInterpolatedStateAlongRoute(activeRouteCoords, videoProgress);
  const currentCenterLat = isPlaying ? routeState.position[0] : activeBus?.current_lat || cityCenter[0];
  const currentCenterLng = isPlaying ? routeState.position[1] : activeBus?.current_lng || cityCenter[1];

  // Traveled trail
  const traveledCoords = [
    ...activeRouteCoords.slice(0, routeState.segmentIndex + 1),
    routeState.position,
  ];

  // Alert filtering for pins
  const displayedAlerts = alerts
    .filter((a) => a.latitude != null && a.longitude != null && isFinite(a.latitude) && isFinite(a.longitude))
    .filter((a) => {
      if (selectedCategory === 'all') return true;
      const roadTypes = ['pothole', 'water_logging', 'road_crack', 'road_damage', 'garbage', 'missing_divider', 'zebra_fading'];
      const trafficTypes = ['vehicle_density', 'congestion'];
      const safetyTypes = ['overloaded_two_wheeler', 'helmet_violation', 'rash_driving', 'accident', 'watchlist_match'];
      if (selectedCategory === 'road' || selectedCategory === 'all_road') return roadTypes.includes(a.alert_type);
      if (selectedCategory === 'traffic' || selectedCategory === 'all_traffic') return trafficTypes.includes(a.alert_type);
      if (selectedCategory === 'safety' || selectedCategory === 'all_safety') return safetyTypes.includes(a.alert_type);
      return a.alert_type === selectedCategory;
    });

  // Calculate complete heatmap points for all incidents & route corridors
  const heatPoints = React.useMemo(() => {
    if (!showHeatmap) return [];
    const points = [];

    // 1. All valid city alerts with weighted intensities
    alerts.forEach((a) => {
      if (!a.latitude || !a.longitude || !isFinite(a.latitude) || !isFinite(a.longitude)) return;
      const baseIntensity = a.priority_level === 'P0' ? 1.0 : a.priority_level === 'P1' ? 0.75 : a.priority_level === 'P2' ? 0.55 : 0.35;
      points.push([a.latitude, a.longitude, baseIntensity]);
    });

    // 2. Add subtle route waypoint density points to smoothly connect corridor hotspots
    const route = activeRouteCoords || [];
    const sampleStep = Math.max(1, Math.floor(route.length / 25));
    for (let i = 0; i < route.length; i += sampleStep) {
      const pt = route[i];
      points.push([pt[0], pt[1], 0.25]);
    }

    return points;
  }, [showHeatmap, alerts, activeRouteCoords]);

  const toggleFullscreen = useCallback(() => {
    if (!mapContainerRef.current) return;
    if (!document.fullscreenElement) {
      mapContainerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  }, []);

  return (
    <div
      ref={mapContainerRef}
      className={`relative w-full h-full min-h-[440px] rounded-xl overflow-hidden shadow-sm bg-slate-100 ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none' : ''
      }`}
    >
      {/* ── TOP LEFT: Map style + pin count ── */}
      <div className="absolute top-3 left-3 z-20 flex items-center gap-2">
        {/* Style picker */}
        <div className="relative">
          <button
            onClick={() => setShowStyleMenu(!showStyleMenu)}
            className="map-glass-panel flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-slate-700 hover:bg-white/95 transition-all"
          >
            <span>{mapStyleConfig.icon}</span>
            <span>{mapStyleConfig.name}</span>
            <Layers className="w-3 h-3 text-slate-400" />
          </button>

          {showStyleMenu && (
            <div className="absolute top-full left-0 mt-1.5 w-44 bg-white rounded-xl border border-slate-200 shadow-xl p-1.5 z-30">
              {Object.values(MAP_STYLES).map((style) => (
                <button
                  key={style.id}
                  onClick={() => { setActiveMapStyle(style.id); setShowStyleMenu(false); }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] transition-colors cursor-pointer ${
                    activeMapStyle === style.id
                      ? 'bg-blue-50 text-blue-700 font-semibold'
                      : 'text-slate-600 hover:bg-slate-50 font-medium'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span>{style.icon}</span>
                    <span>{style.name}</span>
                  </div>
                  {activeMapStyle === style.id && <Check className="w-3 h-3 text-blue-600" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Pin count badge */}
        <div className="map-glass-panel px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-slate-600">
          {displayedAlerts.length} alerts
        </div>
      </div>

      {/* ── TOP RIGHT: controls ── */}
      <div className="absolute top-3 right-3 z-20 flex items-center gap-2">
        {/* Toggle all routes */}
        <button
          onClick={() => setShowAllRoutes(!showAllRoutes)}
          title={showAllRoutes ? 'Hide other routes' : 'Show all routes'}
          className={`map-glass-panel flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
            showAllRoutes ? 'text-slate-700 hover:bg-white/95' : 'text-slate-400 hover:bg-white/95'
          }`}
        >
          <Route className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Routes</span>
        </button>

        {/* Heatmap toggle button */}
        <button
          onClick={() => setShowHeatmap(!showHeatmap)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer shadow-sm ${
            showHeatmap
              ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-orange-300'
              : 'map-glass-panel text-slate-700 hover:bg-white/95'
          }`}
        >
          <Flame className={`w-3.5 h-3.5 ${showHeatmap ? 'animate-pulse text-yellow-300' : ''}`} />
          <span>Heatmap</span>
        </button>

        {/* Recenter */}
        <button
          onClick={() => setCenterSignal((p) => p + 1)}
          title="Recenter on bus"
          className="map-glass-panel p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-white/95 transition-all cursor-pointer"
        >
          <Target className="w-4 h-4" />
        </button>

        {/* Fullscreen */}
        <button
          onClick={toggleFullscreen}
          title="Fullscreen"
          className="map-glass-panel p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-white/95 transition-all cursor-pointer"
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>

      {/* ── BOTTOM LEFT: route legend ── */}
      {showAllRoutes && (
        <div className="absolute bottom-6 left-3 z-20 map-glass-panel rounded-lg px-3 py-2 flex flex-col gap-1">
          {cityBusIds.map((busId) => {
            const rd = ROUTE_DISPLAY[busId];
            if (!rd) return null;
            return (
              <div key={busId} className="flex items-center gap-2">
                <div
                  style={{ background: rd.color }}
                  className="w-6 h-1 rounded-full opacity-80"
                />
                <span className="text-[10px] font-mono font-semibold text-slate-600">{rd.label}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* ── BOTTOM RIGHT: Heat Intensity Legend ── */}
      {showHeatmap && (
        <div className="absolute bottom-6 right-3 z-20 bg-slate-950/90 backdrop-blur-md border border-slate-700/80 rounded-xl p-3 flex flex-col gap-1.5 min-w-[170px] shadow-2xl text-slate-100 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-100 pb-1 border-b border-slate-800">
            <Flame className="w-3.5 h-3.5 text-orange-400 fill-orange-400/20" />
            <span>Heat Intensity</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-300 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-[#2ee6a6] shadow-[0_0_6px_#2ee6a6] inline-block"></span>
            <span>Low Density</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-300 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ffe66d] shadow-[0_0_6px_#ffe66d] inline-block"></span>
            <span>Moderate</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-300 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ff8a3d] shadow-[0_0_6px_#ff8a3d] inline-block"></span>
            <span>High Risk</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-300 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ff3b4f] shadow-[0_0_6px_#ff3b4f] inline-block"></span>
            <span>Critical Hotspot</span>
          </div>
        </div>
      )}

      {/* ── LEAFLET MAP ── */}
      <MapContainer
        center={cityCenter}
        zoom={13}
        className="w-full h-full z-0"
        zoomControl={false}
      >
        <TileLayer
          key={activeMapStyle}
          attribution={mapStyleConfig.attribution}
          url={mapStyleConfig.url}
        />

        <MapUpdater
          lat={currentCenterLat}
          lng={currentCenterLng}
          isMoving={isPlaying}
          selectedIncident={selectedIncident}
          activeCity={activeCity}
          centerOnBusSignal={centerSignal}
        />

        {/* ── LEAFLET.HEAT LAYER ── */}
        <LeafletHeatmapLayer points={heatPoints} showHeatmap={showHeatmap} />

        {/* ── CITY ROUTES (All routes drawn solid; selected bus/incident route glows brightly) ── */}
        {cityBusIds.map((busId) => {
          const rd = ROUTE_DISPLAY[busId];
          if (!rd) return null;
          const isTarget = busId === targetBusId;
          return (
            <Polyline
              key={`route-city-${busId}`}
              positions={rd.coords}
              pathOptions={{
                color: rd.color,
                weight: isTarget ? 5.5 : 3.5,
                opacity: isTarget ? 0.95 : (showAllRoutes ? 0.65 : 0.25),
                dashArray: isTarget ? undefined : (showAllRoutes ? undefined : '5, 8'),
              }}
            />
          );
        })}

        {/* ── TRAVELED TRAIL (bright active bus path) ── */}
        {traveledCoords.length > 1 && (
          <Polyline
            positions={traveledCoords}
            pathOptions={{ color: activeRouteInfo.color, weight: 6, opacity: 1.0 }}
          />
        )}

        {/* ── BUS MARKERS ── */}
        {buses.map((bus) => {
          const isThisBusActive = activeBus?.bus_label === bus.bus_label;
          const isMoving = isThisBusActive && isPlaying;
          const speed = isMoving ? activeBus?.speed_kmh || bus.speed_kmh || 32 : 0;
          const markerPos =
            isThisBusActive && isPlaying
              ? routeState.position
              : [bus.current_lat, bus.current_lng];
          const busBearing = isThisBusActive && isPlaying ? routeState.bearing : 0;
          const rd = ROUTE_DISPLAY[bus.bus_label];

          return (
            <Marker
              key={`bus-${bus.id || bus.bus_label}`}
              position={markerPos}
              icon={createBusIcon(bus.bus_label, speed, isMoving, isThisBusActive, busBearing)}
              eventHandlers={{ click: () => onSelectBus && onSelectBus(bus) }}
            >
              <Popup offset={[0, -32]} closeButton={false}>
                <div className="p-3 w-52 font-sans text-xs">
                  <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <div
                        style={{ background: rd?.color || '#94A3B8' }}
                        className="w-2.5 h-2.5 rounded-full"
                      />
                      <span className="font-bold text-slate-900 text-sm">{bus.bus_label}</span>
                    </div>
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold ${
                        isMoving ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {isMoving ? `${speed} km/h` : 'STANDBY'}
                    </span>
                  </div>
                  <p className="text-slate-500 text-[10px] mb-2.5 leading-relaxed">{bus.route_name}</p>
                  <button
                    onClick={() => onSelectBus && onSelectBus(bus)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-1.5 rounded-lg text-[11px] transition-colors cursor-pointer"
                  >
                    Select Live Stream →
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* ── INCIDENT MARKERS ── */}
        {displayedAlerts.map((alert) => (
          <Marker
            key={`alert-${alert.id}`}
            position={[alert.latitude, alert.longitude]}
            icon={createIncidentIcon(alert)}
            eventHandlers={{ click: () => onSelectAlert && onSelectAlert(alert) }}
          >
            <Popup offset={[0, -18]} closeButton={false}>
              <div className="p-3 w-60 text-xs font-sans">
                <div className="flex items-center justify-between mb-1.5 pb-1.5 border-b border-slate-100">
                  <span className="font-mono font-bold text-slate-800 text-[11px]">
                    {alert.alert_code}
                  </span>
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold ${
                      alert.priority_level === 'P0'
                        ? 'bg-red-600 text-white'
                        : alert.priority_level === 'P1'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {alert.priority_level || 'P2'}
                  </span>
                </div>
                <div className="font-semibold text-slate-800 mb-0.5">
                  {alert.alert_type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                </div>
                <p className="text-[10px] text-slate-400 mb-2">{alert.location_name}</p>
                <div className="flex gap-3 text-[10px] text-slate-500 font-mono mb-2.5">
                  <span>Confidence: <strong className="text-slate-700">{(alert.confidence * 100).toFixed(0)}%</strong></span>
                  <span>Seen: <strong className="text-purple-600">{alert.sighting_count || 1}×</strong></span>
                </div>
                <button
                  onClick={() => onSelectAlert && onSelectAlert(alert)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-1.5 rounded-lg text-[11px] transition-colors cursor-pointer"
                >
                  Inspect Evidence →
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

