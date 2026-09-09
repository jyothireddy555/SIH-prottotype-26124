import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Layers, Eye, Disc, Car, Bus as BusIcon, Flame, AlertTriangle, Droplets } from 'lucide-react';

// Fix default Leaflet icon paths
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom 3D SVG Bus Icon
const createBusIcon = (label, speed, isMoving, isActive) => {
  const uid = `${label}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const badgeColor = isMoving 
    ? 'bg-emerald-50 text-emerald-800 border-emerald-300 ring-2 ring-emerald-400' 
    : isActive 
    ? 'bg-blue-50 text-blue-800 border-blue-300' 
    : 'bg-slate-50 text-slate-800 border-slate-300';

  const pulseClass = isMoving ? 'pulse-bus-icon' : '';
  const statusDot = isMoving 
    ? '<span class="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-ping mr-1"></span>' 
    : '<span class="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block mr-1"></span>';
  const speedText = isMoving ? `${speed} km/h` : 'STOPPED';

  const isHyd = label.startsWith('HYD');
  const color1 = isHyd ? '#059669' : label === 'BUS-218' ? '#4F46E5' : label === 'BUS-301' ? '#7C3AED' : '#2563EB';
  const color2 = isHyd ? '#047857' : label === 'BUS-218' ? '#3730A3' : label === 'BUS-301' ? '#5B21B6' : '#1D4ED8';
  const color3 = isHyd ? '#064E3B' : label === 'BUS-218' ? '#312E81' : label === 'BUS-301' ? '#4C1D95' : '#1E3A8A';

  return L.divIcon({
    className: 'custom-bus-marker',
    html: `
      <div class="relative flex flex-col items-center cursor-pointer transition-transform hover:scale-115">
        <div class="relative flex items-center justify-center ${pulseClass}">
          <svg class="w-11 h-11 filter drop-shadow-[0_8px_14px_rgba(0,0,0,0.35)]" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="roofGrad_${uid}" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.95"/>
                <stop offset="100%" stop-color="#CBD5E1"/>
              </linearGradient>
              <linearGradient id="bodyGrad_${uid}" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stop-color="${color1}"/>
                <stop offset="50%" stop-color="${color2}"/>
                <stop offset="100%" stop-color="${color3}"/>
              </linearGradient>
              <linearGradient id="tireGrad_${uid}" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#334155"/>
                <stop offset="100%" stop-color="#0F172A"/>
              </linearGradient>
            </defs>

            <ellipse cx="32" cy="56" rx="24" ry="5.5" fill="#000000" fill-opacity="0.32"/>
            <rect x="10" y="44" width="7" height="11" rx="3.5" fill="url(#tireGrad_${uid})" stroke="#64748B" stroke-width="0.8"/>
            <circle cx="13.5" cy="49.5" r="2" fill="#94A3B8"/>
            <rect x="47" y="44" width="7" height="11" rx="3.5" fill="url(#tireGrad_${uid})" stroke="#64748B" stroke-width="0.8"/>
            <circle cx="50.5" cy="49.5" r="2" fill="#94A3B8"/>
            <rect x="6" y="38" width="6" height="9" rx="2.5" fill="url(#tireGrad_${uid})"/>
            <rect x="52" y="38" width="6" height="9" rx="2.5" fill="url(#tireGrad_${uid})"/>
            <path d="M11 46 L53 46 L50 51 L14 51 Z" fill="#0F172A"/>

            <path d="M10 18 C10 12, 14 8, 20 8 L44 8 C50 8, 54 12, 54 18 L54 44 C54 47.5, 50.5 49.5, 46 49.5 L18 49.5 C13.5 49.5, 10 47.5, 10 44 Z" fill="url(#bodyGrad_${uid})" stroke="#FFFFFF" stroke-width="1.6"/>
            <path d="M14 10 C16 8.8, 22 8.2, 32 8.2 C42 8.2, 48 8.8, 50 10 L48 13.5 L16 13.5 Z" fill="url(#roofGrad_${uid})"/>
            <rect x="22" y="5" width="20" height="4.5" rx="2" fill="#F8FAFC" stroke="#94A3B8" stroke-width="0.8"/>

            <rect x="18" y="11.5" width="28" height="5.5" rx="1.5" fill="#0F172A" stroke="#334155" stroke-width="0.6"/>
            <text x="32" y="15.8" fill="#F59E0B" font-size="3.6" font-family="monospace" font-weight="900" text-anchor="middle">${label}</text>

            <path d="M15 19 L49 19 L47 31 L17 31 Z" fill="#0284C7" stroke="#E2E8F0" stroke-width="1.2"/>
            <line x1="26" y1="19" x2="25" y2="31" stroke="#E2E8F0" stroke-width="1"/>
            <line x1="38" y1="19" x2="39" y2="31" stroke="#E2E8F0" stroke-width="1"/>
          </svg>
        </div>

        <div class="${badgeColor} text-[10px] font-bold px-2 py-0.5 rounded shadow-md border mt-0.5 whitespace-nowrap flex items-center">
          ${statusDot}
          <span>${label} · ${speedText}</span>
        </div>
      </div>
    `,
    iconSize: [56, 62],
    iconAnchor: [28, 31]
  });
};

// Generic Custom Incident Marker Icon Generator for all Edge-AI Types
const createIncidentIcon = (alert) => {
  const type = alert.alert_type;
  const isP0 = alert.priority_level === 'P0' || type === 'watchlist_match' || type === 'accident';
  const isP1 = alert.priority_level === 'P1' || alert.severity === 'CRITICAL';
  
  let emoji = '🕳';
  let bgColor = 'bg-rose-600';
  let pulseClass = '';

  if (type === 'watchlist_match') {
    emoji = '🚨';
    bgColor = 'bg-red-600';
    pulseClass = 'animate-bounce ring-4 ring-red-400';
  } else if (type === 'accident') {
    emoji = '💥';
    bgColor = 'bg-red-600';
    pulseClass = 'animate-ping ring-4 ring-red-400';
  } else if (type === 'water_logging') {
    emoji = '🌊';
    bgColor = 'bg-blue-600';
  } else if (type === 'missing_divider') {
    emoji = '🚧';
    bgColor = 'bg-amber-600';
  } else if (type === 'road_crack' || type === 'road_damage') {
    emoji = '⚡';
    bgColor = 'bg-orange-600';
  } else if (type === 'garbage') {
    emoji = '🗑';
    bgColor = 'bg-stone-700';
  } else if (type === 'zebra_fading') {
    emoji = '🦓';
    bgColor = 'bg-yellow-600';
  } else if (type === 'overloaded_two_wheeler') {
    emoji = '🛵';
    bgColor = 'bg-red-700';
  } else if (type === 'helmet_violation') {
    emoji = '⛑';
    bgColor = 'bg-amber-700';
  } else if (type === 'vehicle_density' || type === 'congestion') {
    emoji = '🚗';
    bgColor = 'bg-amber-500';
  }

  const countBadge = (alert.sighting_count || 1) > 1 
    ? `<span class="ml-1 bg-amber-200 text-amber-900 px-1 rounded font-extrabold text-[8px]">${alert.sighting_count}x</span>` 
    : '';

  return L.divIcon({
    className: 'custom-incident-marker',
    html: `
      <div class="relative flex flex-col items-center cursor-pointer">
        <div class="${bgColor} text-white w-7 h-7 rounded-full shadow-md border-2 border-white flex items-center justify-center ${pulseClass}">
          <span class="text-[11px] font-bold">${emoji}</span>
        </div>
        <div class="bg-white text-slate-800 text-[9px] font-mono font-bold px-1.5 py-0.2 rounded shadow border border-slate-200 mt-0.5 whitespace-nowrap flex items-center">
          <span>${alert.alert_code || alert.alert_type}</span>
          ${countBadge}
        </div>
      </div>
    `,
    iconSize: [36, 42],
    iconAnchor: [18, 21]
  });
};

// Helper for GPS interpolation
export function interpolatePositionAlongRoute(coords, progress) {
  if (!coords || coords.length === 0) return [17.4435, 78.3772];
  if (coords.length === 1) return coords[0];
  const p = Math.max(0, Math.min(progress, 0.99999));
  
  const scaledIndex = p * (coords.length - 1);
  const segmentIdx = Math.floor(scaledIndex);
  const segmentFraction = scaledIndex - segmentIdx;
  
  const p1 = coords[segmentIdx];
  const p2 = coords[Math.min(segmentIdx + 1, coords.length - 1)];
  
  const lat = p1[0] + (p2[0] - p1[0]) * segmentFraction;
  const lng = p1[1] + (p2[1] - p1[1]) * segmentFraction;
  
  return [lat, lng];
}

// MapUpdater: Centers map when selectedIncident, bus move, or city switches
function MapUpdater({ lat, lng, isMoving, selectedIncident, activeCity }) {
  const map = useMap();
  const prevCityRef = useRef(activeCity);
  
  useEffect(() => {
    if (prevCityRef.current !== activeCity) {
      prevCityRef.current = activeCity;
      if (activeCity === 'hyderabad') {
        map.flyTo([17.4435, 78.3772], 13, { duration: 1.5 });
      } else {
        map.flyTo([18.5380, 73.7850], 13, { duration: 1.5 });
      }
      return;
    }

    if (selectedIncident && selectedIncident.latitude && selectedIncident.longitude) {
      map.flyTo([selectedIncident.latitude, selectedIncident.longitude], 15, { duration: 1.2 });
    } else if (lat && lng && isMoving) {
      map.panTo([lat, lng], { animate: true, duration: 0.8 });
    }
  }, [lat, lng, isMoving, selectedIncident, activeCity, map]);

  return null;
}

// === HYDERABAD ROUTE COORDINATES ===
export const route216Coords = [
  [17.4400, 78.3480],
  [17.4425, 78.3530],
  [17.4460, 78.3610],
  [17.4505, 78.3808],
  [17.4475, 78.3815],
  [17.4430, 78.3820],
  [17.4380, 78.3850],
  [17.4310, 78.3900],
  [17.4350, 78.3750],
  [17.4260, 78.3580],
  [17.4180, 78.3440],
  [17.4160, 78.3410]
];

export const route10HCoords = [
  [17.3916, 78.4398],
  [17.3980, 78.4480],
  [17.4040, 78.4550],
  [17.4090, 78.4620],
  [17.4150, 78.4690],
  [17.4220, 78.4760],
  [17.4310, 78.4870],
  [17.4390, 78.4980]
];

export const route5KCoords = [
  [17.3616, 78.4747],
  [17.3710, 78.4820],
  [17.3820, 78.4860],
  [17.3750, 78.5020],
  [17.3680, 78.5240],
  [17.3590, 78.5480]
];

// === PUNE ROUTE COORDINATES ===
export const route115Coords = [
  [18.5380, 73.7850],
  [18.5420, 73.7815],
  [18.5460, 73.7780],
  [18.5500, 73.7745],
  [18.5540, 73.7710],
  [18.5580, 73.7675],
  [18.5620, 73.7640],
  [18.5660, 73.7605],
  [18.5700, 73.7570],
  [18.5740, 73.7535],
  [18.5780, 73.7500],
  [18.5820, 73.7465],
  [18.5860, 73.7430],
  [18.5900, 73.7395],
  [18.5940, 73.7360],
  [18.5980, 73.7325],
  [18.6020, 73.7290]
];

export const route500DCoords = [
  [18.5284, 73.8740],
  [18.5320, 73.8790],
  [18.5360, 73.8845],
  [18.5400, 73.8900],
  [18.5440, 73.8955],
  [18.5480, 73.9010],
  [18.5520, 73.9065],
  [18.5560, 73.9120],
  [18.5600, 73.9175],
  [18.5640, 73.9230],
  [18.5680, 73.9285],
  [18.5720, 73.9340],
  [18.5760, 73.9395],
  [18.5800, 73.9450],
  [18.5840, 73.9505],
  [18.5880, 73.9560],
  [18.5920, 73.9615],
  [18.5960, 73.9670]
];

export const route335ECoords = [
  [18.4480, 73.8640],
  [18.4530, 73.8590],
  [18.4580, 73.8540],
  [18.4630, 73.8490],
  [18.4680, 73.8440],
  [18.4730, 73.8390],
  [18.4780, 73.8340],
  [18.4830, 73.8290],
  [18.4880, 73.8240],
  [18.4930, 73.8190],
  [18.4980, 73.8140],
  [18.5030, 73.8090],
  [18.5080, 73.8040],
  [18.5130, 73.7990],
  [18.5180, 73.7940]
];

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
  onSelectBus
}) {
  const [showHeatmap, setShowHeatmap] = useState(false);

  // Map center for city
  const cityCenter = activeCity === 'hyderabad' ? [17.4435, 78.3772] : [18.5380, 73.7850];

  // Pick active route coords based on active bus
  let activeRouteCoords = route216Coords;
  if (activeBus?.bus_label === 'HYD-204') activeRouteCoords = route10HCoords;
  else if (activeBus?.bus_label === 'HYD-305') activeRouteCoords = route5KCoords;
  else if (activeBus?.bus_label === 'BUS-104') activeRouteCoords = route115Coords;
  else if (activeBus?.bus_label === 'BUS-218') activeRouteCoords = route500DCoords;
  else if (activeBus?.bus_label === 'BUS-301') activeRouteCoords = route335ECoords;

  const interpolatedPos = interpolatePositionAlongRoute(activeRouteCoords, videoProgress);
  const currentCenterLat = isPlaying ? interpolatedPos[0] : activeBus?.current_lat || cityCenter[0];
  const currentCenterLng = isPlaying ? interpolatedPos[1] : activeBus?.current_lng || cityCenter[1];

  // Filter alerts by selectedCategory
  const displayedAlerts = alerts
    .filter((alert) => alert.latitude != null && alert.longitude != null && isFinite(alert.latitude) && isFinite(alert.longitude))
    .filter((alert) => {
      if (selectedCategory === 'all') return true;
      if (selectedCategory === 'road' || selectedCategory === 'all_road') {
        return ['pothole', 'water_logging', 'road_crack', 'road_damage', 'garbage', 'missing_divider', 'zebra_fading'].includes(alert.alert_type);
      }
      if (selectedCategory === 'traffic' || selectedCategory === 'all_traffic') {
        return ['vehicle_density', 'congestion'].includes(alert.alert_type);
      }
      if (selectedCategory === 'safety' || selectedCategory === 'all_safety') {
        return ['overloaded_two_wheeler', 'helmet_violation', 'rash_driving', 'accident', 'watchlist_match'].includes(alert.alert_type);
      }
      if (selectedCategory === 'potholes' || selectedCategory === 'pothole') return alert.alert_type === 'pothole';
      if (selectedCategory === 'water_logging') return alert.alert_type === 'water_logging';
      if (selectedCategory === 'missing_divider') return alert.alert_type === 'missing_divider';
      if (selectedCategory === 'damaged_road' || selectedCategory === 'road_crack') return ['road_crack', 'road_damage'].includes(alert.alert_type);
      if (selectedCategory === 'garbage') return alert.alert_type === 'garbage';
      if (selectedCategory === 'zebra_fading') return alert.alert_type === 'zebra_fading';
      if (selectedCategory === 'congestion') return alert.alert_type === 'congestion';
      if (selectedCategory === 'vehicle_density') return alert.alert_type === 'vehicle_density';
      if (selectedCategory === 'overloaded_two_wheeler') return alert.alert_type === 'overloaded_two_wheeler';
      if (selectedCategory === 'helmet_violation') return alert.alert_type === 'helmet_violation';
      if (selectedCategory === 'accident' || selectedCategory === 'rash_driving') return ['accident', 'rash_driving'].includes(alert.alert_type);
      if (selectedCategory === 'watchlist_match') return alert.alert_type === 'watchlist_match';
      return alert.alert_type === selectedCategory;
    });

  return (
    <div className="relative w-full h-full min-h-[440px] rounded-xl overflow-hidden border border-slate-200 shadow-xs bg-white">
      {/* Overlay Toolbar */}
      <div className="absolute top-3 left-3 z-10 bg-white/95 backdrop-blur-xs p-1.5 rounded-xl border border-slate-200 shadow-md flex items-center space-x-2 text-xs font-medium text-slate-700">
        <span className="text-[10px] font-mono uppercase text-slate-400 font-bold px-1.5">
          {activeCity.toUpperCase()} CORRIDOR
        </span>

        <span className="text-[11px] font-mono font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
          {displayedAlerts.length} Map Pins
        </span>

        <button
          onClick={() => setShowHeatmap(!showHeatmap)}
          className={`flex items-center space-x-1 px-2.5 py-1 rounded-md transition-all text-xs ${
            showHeatmap ? 'bg-orange-500 text-white font-bold shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Flame className="w-3.5 h-3.5" />
          <span>Heatmap</span>
        </button>
      </div>

      <MapContainer
        center={cityCenter}
        zoom={13}
        className="w-full h-full z-0"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        <MapUpdater
          lat={currentCenterLat}
          lng={currentCenterLng}
          isMoving={isPlaying}
          selectedIncident={selectedIncident}
          activeCity={activeCity}
        />

        {/* Polylines for Active Routes */}
        {activeCity === 'hyderabad' ? (
          <>
            <Polyline positions={route216Coords} pathOptions={{ color: '#0284C7', weight: 4, opacity: 0.8 }} />
            <Polyline positions={route10HCoords} pathOptions={{ color: '#0D9488', weight: 3.5, opacity: 0.6 }} />
            <Polyline positions={route5KCoords} pathOptions={{ color: '#6366F1', weight: 3.5, opacity: 0.6 }} />
          </>
        ) : (
          <>
            <Polyline positions={route115Coords} pathOptions={{ color: '#2563EB', weight: 4, opacity: 0.8 }} />
            <Polyline positions={route500DCoords} pathOptions={{ color: '#4F46E5', weight: 3.5, opacity: 0.6 }} />
            <Polyline positions={route335ECoords} pathOptions={{ color: '#7C3AED', weight: 3.5, opacity: 0.6 }} />
          </>
        )}

        {/* Heatmap Rings */}
        {showHeatmap &&
          displayedAlerts.map((alert) => (
            <Circle
              key={`heat-${alert.id}`}
              center={[alert.latitude, alert.longitude]}
              radius={70}
              pathOptions={{
                fillColor: alert.priority_level === 'P0' ? '#DC2626' : '#EA580C',
                fillOpacity: 0.25,
                stroke: false
              }}
            />
          ))}

        {/* Bus Markers */}
        {buses.map((bus) => {
          const isThisBusActive = activeBus && activeBus.bus_label === bus.bus_label;
          const isMoving = isThisBusActive ? isPlaying : false;
          const speed = isMoving ? activeBus?.speed_kmh || bus.speed_kmh || 32 : 0;
          const markerPos = isThisBusActive && isPlaying ? interpolatedPos : [bus.current_lat, bus.current_lng];

          return (
            <Marker
              key={`bus-${bus.id || bus.bus_label}`}
              position={markerPos}
              icon={createBusIcon(bus.bus_label, speed, isMoving, isThisBusActive)}
              eventHandlers={{
                click: () => onSelectBus && onSelectBus(bus)
              }}
            >
              <Popup offset={[130, -5]} closeButton={false}>
                <div className="p-3 w-52 font-sans text-xs">
                  <div className="flex items-center justify-between border-b pb-1.5 mb-1.5 font-bold">
                    <span>{bus.bus_label}</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-mono">
                      {isMoving ? 'ONLINE' : 'STANDBY'}
                    </span>
                  </div>
                  <p className="text-slate-600 text-[11px] mb-2">{bus.route_name}</p>
                  <button
                    onClick={() => onSelectBus && onSelectBus(bus)}
                    className="w-full bg-blue-600 text-white font-bold py-1 rounded text-center text-xs"
                  >
                    Select Bus Stream →
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Incident Alert Markers */}
        {displayedAlerts.map((alert) => (
          <Marker
            key={`alert-${alert.id}`}
            position={[alert.latitude, alert.longitude]}
            icon={createIncidentIcon(alert)}
            eventHandlers={{
              click: () => onSelectAlert && onSelectAlert(alert)
            }}
          >
            <Popup offset={[0, -20]}>
              <div className="p-2.5 w-60 text-xs font-sans">
                <div className="flex items-center justify-between border-b pb-1 mb-1 font-bold">
                  <span className="text-slate-900">{alert.alert_code}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded font-extrabold bg-red-100 text-red-800">
                    {alert.priority_level || 'P1'}
                  </span>
                </div>
                <div className="font-semibold text-slate-800 mb-1">{alert.alert_type.toUpperCase().replace(/_/g, ' ')}</div>
                <p className="text-[11px] text-slate-500 mb-2">{alert.location_name}</p>
                <div className="text-[10px] font-mono text-slate-600 bg-slate-50 p-1.5 rounded border mb-2">
                  <div>Confidence: {(alert.confidence * 100).toFixed(1)}%</div>
                  <div>Sighted: {alert.sighting_count || 1} passes</div>
                </div>
                <button
                  onClick={() => onSelectAlert && onSelectAlert(alert)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-1.5 rounded-lg text-center text-xs shadow-xs transition-colors cursor-pointer"
                >
                  Inspect AI Evidence →
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
