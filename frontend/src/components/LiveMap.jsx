import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, CircleMarker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Layers, Eye, Disc, Car, Bus as BusIcon, Flame, AlertTriangle } from 'lucide-react';

// Fix default Leaflet icon paths
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom SVG Icons for Light Theme
const createBusIcon = (label, speed, isMoving, isActive) => {
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

  const busColor = label === 'BUS-218' ? 'bg-indigo-600' : label === 'BUS-301' ? 'bg-purple-600' : 'bg-blue-600';

  return L.divIcon({
    className: 'custom-bus-marker',
    html: `
      <div class="relative flex flex-col items-center cursor-pointer transition-transform hover:scale-110">
        <div class="${busColor} text-white p-2 rounded-xl shadow-lg border-2 border-white flex items-center justify-center ${pulseClass}">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
        </div>
        <div class="${badgeColor} text-[10px] font-bold px-1.5 py-0.5 rounded shadow border mt-1 whitespace-nowrap flex items-center">
          ${statusDot}
          <span>${label} · ${speedText}</span>
        </div>
      </div>
    `,
    iconSize: [44, 52],
    iconAnchor: [22, 26]
  });
};

const createPotholeIcon = (severity, confidence) => {
  const isCritical = severity === 'CRITICAL';
  const bgColor = isCritical ? 'bg-red-600' : 'bg-rose-500';
  return L.divIcon({
    className: 'custom-pothole-marker',
    html: `
      <div class="relative flex flex-col items-center">
        <div class="${bgColor} text-white w-7 h-7 rounded-full shadow-md border-2 border-white flex items-center justify-center pulse-pothole">
          <span class="text-[11px] font-bold">🕳</span>
        </div>
        <div class="bg-white text-red-700 text-[9px] font-mono font-bold px-1 py-0.2 rounded shadow border border-red-200 mt-0.5 whitespace-nowrap">
          ${(confidence * 100).toFixed(0)}% [${severity}]
        </div>
      </div>
    `,
    iconSize: [32, 38],
    iconAnchor: [16, 19]
  });
};

const createTrafficIcon = (count) => {
  return L.divIcon({
    className: 'custom-traffic-marker',
    html: `
      <div class="relative flex flex-col items-center">
        <div class="bg-amber-500 text-white w-7 h-7 rounded-full shadow-md border-2 border-white flex items-center justify-center pulse-traffic">
          <span class="text-[11px] font-bold">🚗</span>
        </div>
        <div class="bg-white text-amber-800 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded shadow border border-amber-200 mt-0.5 whitespace-nowrap">
          ${count} veh
        </div>
      </div>
    `,
    iconSize: [32, 38],
    iconAnchor: [16, 19]
  });
};

// Component to dynamically re-center map when active bus moves
function MapUpdater({ lat, lng, isMoving }) {
  const map = useMap();
  useEffect(() => {
    if (lat && lng && isMoving) {
      map.panTo([lat, lng], { animate: true, duration: 1.0 });
    }
  }, [lat, lng, isMoving, map]);
  return null;
}

export default function LiveMap({ 
  alerts = [], 
  buses = [], 
  activeBus, 
  isPlaying = false,
  onSelectAlert, 
  onSelectBus
}) {
  const [showPotholes, setShowPotholes] = useState(true);
  const [showTraffic, setShowTraffic] = useState(true);
  const [showBuses, setShowBuses] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(false);

  // Default transit center
  const defaultCenter = [18.5350, 73.8567];

  // 3 Distinct Full-Length Urban Transit Corridors
  const route115Coords = [
    [18.5392, 73.7680],
    [18.5420, 73.7712],
    [18.5445, 73.7745],
    [18.5470, 73.7772],
    [18.5492, 73.7798],
    [18.5515, 73.7820],
    [18.5538, 73.7848],
    [18.5562, 73.7870],
    [18.5582, 73.7892],
    [18.5605, 73.7918],
    [18.5628, 73.7945],
    [18.5645, 73.7968],
    [18.5675, 73.7998],
    [18.5702, 73.8028],
    [18.5721, 73.8052],
    [18.5748, 73.8080],
    [18.5775, 73.8020],
    [18.5810, 73.7920],
    [18.5860, 73.7810],
    [18.5910, 73.7710],
    [18.5950, 73.7620],
    [18.5985, 73.7540],
    [18.6015, 73.7460],
    [18.6045, 73.7380],
    [18.6080, 73.7300]
  ];

  const route500DCoords = [
    [18.5284, 73.8743],
    [18.5308, 73.8765],
    [18.5342, 73.8791],
    [18.5375, 73.8825],
    [18.5411, 73.8864],
    [18.5438, 73.8895],
    [18.5468, 73.8927],
    [18.5490, 73.8960],
    [18.5512, 73.8995],
    [18.5535, 73.9030],
    [18.5558, 73.9064],
    [18.5580, 73.9100],
    [18.5604, 73.9142],
    [18.5625, 73.9180],
    [18.5649, 73.9218],
    [18.5670, 73.9255],
    [18.5700, 73.9300],
    [18.5735, 73.9356],
    [18.5760, 73.9400],
    [18.5790, 73.9450],
    [18.5815, 73.9485],
    [18.5835, 73.9515],
    [18.5855, 73.9545],
    [18.5880, 73.9575]
  ];

  const route335ECoords = [
    [18.5015, 73.8580],
    [18.4965, 73.8588],
    [18.4920, 73.8595],
    [18.4865, 73.8602],
    [18.4815, 73.8612],
    [18.4750, 73.8620],
    [18.4685, 73.8628],
    [18.4620, 73.8638],
    [18.4550, 73.8645],
    [18.4510, 73.8580],
    [18.4480, 73.8510],
    [18.4530, 73.8420],
    [18.4610, 73.8340],
    [18.4700, 73.8260],
    [18.4790, 73.8180],
    [18.4870, 73.8110],
    [18.4960, 73.8030],
    [18.5040, 73.7960],
    [18.5120, 73.7890],
    [18.5190, 73.7820],
    [18.5260, 73.7760],
    [18.5340, 73.7710]
  ];

  return (
    <div className="relative w-full h-[520px] lg:h-full min-h-[440px] rounded-xl overflow-hidden border border-slate-200 shadow-xs bg-white">
      
      {/* Map Control Bar Overlay */}
      <div className="absolute top-3 left-3 z-[1000] bg-white/95 backdrop-blur-xs p-1.5 rounded-xl border border-slate-200 shadow-md flex items-center space-x-1.5 text-xs font-medium text-slate-700">
        <span className="text-[10px] font-mono uppercase text-slate-400 px-2 font-bold">MAP LAYERS</span>
        
        <button
          onClick={() => setShowBuses(!showBuses)}
          className={`flex items-center space-x-1 px-2.5 py-1 rounded-md transition-all ${
            showBuses ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-200' : 'text-slate-500 hover:bg-slate-100'
          }`}
        >
          <BusIcon className="w-3.5 h-3.5" />
          <span>Buses ({buses.length})</span>
        </button>

        <button
          onClick={() => setShowPotholes(!showPotholes)}
          className={`flex items-center space-x-1 px-2.5 py-1 rounded-md transition-all ${
            showPotholes ? 'bg-red-50 text-red-700 font-semibold border border-red-200' : 'text-slate-500 hover:bg-slate-100'
          }`}
        >
          <Disc className="w-3.5 h-3.5" />
          <span>Potholes ({alerts.filter(a => a.alert_type === 'pothole').length})</span>
        </button>

        <button
          onClick={() => setShowTraffic(!showTraffic)}
          className={`flex items-center space-x-1 px-2.5 py-1 rounded-md transition-all ${
            showTraffic ? 'bg-amber-50 text-amber-700 font-semibold border border-amber-200' : 'text-slate-500 hover:bg-slate-100'
          }`}
        >
          <Car className="w-3.5 h-3.5" />
          <span>Traffic ({alerts.filter(a => a.alert_type === 'vehicle_density').length})</span>
        </button>

        <button
          onClick={() => setShowHeatmap(!showHeatmap)}
          className={`flex items-center space-x-1.5 px-3 py-1 rounded-md transition-all ${
            showHeatmap 
              ? 'bg-purple-600 text-white font-semibold shadow-xs ring-2 ring-purple-200' 
              : 'text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200'
          }`}
          title="Toggle Urban Risk & Congestion Heatmap"
        >
          <Flame className="w-3.5 h-3.5" />
          <span>Heatmap {showHeatmap ? 'ON' : 'OFF'}</span>
        </button>
      </div>

      {/* Floating Heatmap Intensity Legend (when Heatmap is ON) */}
      {showHeatmap && (
        <div className="absolute bottom-4 right-4 z-[1000] bg-white/95 backdrop-blur-xs p-3 rounded-xl border border-slate-200 shadow-xl text-xs space-y-1.5 animate-fadeIn font-sans">
          <div className="font-bold text-slate-900 border-b border-slate-100 pb-1 flex items-center space-x-1.5">
            <Flame className="w-4 h-4 text-purple-600" />
            <span>Urban Hazard Heatmap</span>
          </div>
          <div className="flex items-center space-x-2 text-[11px] text-slate-600">
            <span className="w-3 h-3 rounded-full bg-red-600 shadow-xs inline-block"></span>
            <span>Critical Pothole Cluster</span>
          </div>
          <div className="flex items-center space-x-2 text-[11px] text-slate-600">
            <span className="w-3 h-3 rounded-full bg-rose-400 shadow-xs inline-block"></span>
            <span>Moderate Surface Defect</span>
          </div>
          <div className="flex items-center space-x-2 text-[11px] text-slate-600">
            <span className="w-3 h-3 rounded-full bg-amber-500 shadow-xs inline-block"></span>
            <span>High Vehicular Congestion</span>
          </div>
        </div>
      )}

      {/* Actual Leaflet Map */}
      <MapContainer
        center={defaultCenter}
        zoom={12}
        style={{ width: '100%', height: '100%', minHeight: '440px' }}
        className="w-full h-full z-0"
        zoomControl={false}
      >
        <MapUpdater lat={activeBus?.current_lat || defaultCenter[0]} lng={activeBus?.current_lng || defaultCenter[1]} isMoving={isPlaying} />
        
        {/* OpenStreetMap / CartoDB Positron Light Tiles */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          maxZoom={19}
        />

        {/* Route 115: Sus Road (West) */}
        <Polyline
          positions={route115Coords}
          pathOptions={{
            color: activeBus?.bus_label === 'BUS-104' ? '#2563EB' : '#94A3B8',
            weight: activeBus?.bus_label === 'BUS-104' ? 5 : 3,
            opacity: activeBus?.bus_label === 'BUS-104' ? 0.85 : 0.4,
            dashArray: '6, 6'
          }}
        />

        {/* Route 500D: Nagar Road (East) */}
        <Polyline
          positions={route500DCoords}
          pathOptions={{
            color: activeBus?.bus_label === 'BUS-218' ? '#4F46E5' : '#94A3B8',
            weight: activeBus?.bus_label === 'BUS-218' ? 5 : 3,
            opacity: activeBus?.bus_label === 'BUS-218' ? 0.85 : 0.4,
            dashArray: '6, 6'
          }}
        />

        {/* Route 335E: Highway (South) */}
        <Polyline
          positions={route335ECoords}
          pathOptions={{
            color: activeBus?.bus_label === 'BUS-301' ? '#7C3AED' : '#94A3B8',
            weight: activeBus?.bus_label === 'BUS-301' ? 5 : 3,
            opacity: activeBus?.bus_label === 'BUS-301' ? 0.85 : 0.4,
            dashArray: '6, 6'
          }}
        />

        {/* HEATMAP LAYER: Radial Hazard & Congestion Intensity Rings */}
        {showHeatmap && alerts.map((alert) => {
          const isPothole = alert.alert_type === 'pothole';
          const isCritical = alert.severity === 'CRITICAL';
          const fillColor = isPothole ? (isCritical ? '#DC2626' : '#F43F5E') : '#F59E0B';
          const radiusMeters = isPothole ? (isCritical ? 550 : 380) : (alert.vehicle_count > 20 ? 700 : 450);

          return (
            <React.Fragment key={`heat-${alert.id}`}>
              {/* Outer soft glow ring */}
              <Circle
                center={[alert.latitude, alert.longitude]}
                radius={radiusMeters}
                pathOptions={{
                  fillColor: fillColor,
                  fillOpacity: 0.18,
                  stroke: false
                }}
              />
              {/* Inner intense core ring */}
              <Circle
                center={[alert.latitude, alert.longitude]}
                radius={radiusMeters * 0.45}
                pathOptions={{
                  fillColor: fillColor,
                  fillOpacity: 0.38,
                  color: fillColor,
                  weight: 1.5,
                  opacity: 0.6
                }}
              />
            </React.Fragment>
          );
        })}

        {/* Bus Fleet Markers */}
        {showBuses && buses.map((bus) => {
          const isThisBusActive = activeBus && activeBus.bus_label === bus.bus_label;
          const isMoving = isThisBusActive ? isPlaying : false;
          const speed = isMoving ? bus.speed_kmh : 0;

          return (
            <Marker
              key={`bus-${bus.id || bus.bus_label}`}
              position={[bus.current_lat, bus.current_lng]}
              icon={createBusIcon(bus.bus_label, speed, isMoving, isThisBusActive)}
              eventHandlers={{
                click: () => onSelectBus && onSelectBus(bus)
              }}
            >
              <Popup>
                <div className="p-3 w-56">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                    <span className="font-bold text-slate-900 text-sm">{bus.bus_label}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${
                      isMoving ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                    }`}>
                      {isMoving ? 'MOVING' : 'IDLE / STOPPED'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mb-1">{bus.route_name}</p>
                  <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-500 mt-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <div>Speed: <b className="text-slate-900">{isMoving ? bus.speed_kmh : 0} km/h</b></div>
                    <div>Potholes: <b className="text-red-600">{bus.total_potholes}</b></div>
                  </div>
                  <button
                    onClick={() => onSelectBus && onSelectBus(bus)}
                    className="w-full mt-2.5 bg-blue-600 text-white text-xs font-semibold py-1.5 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Switch Live Feed to {bus.bus_label} →
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Pothole & Traffic Alert Markers */}
        {alerts.map((alert) => {
          if (alert.alert_type === 'pothole' && !showPotholes) return null;
          if (alert.alert_type === 'vehicle_density' && !showTraffic) return null;

          const isPothole = alert.alert_type === 'pothole';
          const icon = isPothole 
            ? createPotholeIcon(alert.severity, alert.confidence)
            : createTrafficIcon(alert.vehicle_count);

          return (
            <Marker
              key={`alert-${alert.id}`}
              position={[alert.latitude, alert.longitude]}
              icon={icon}
              eventHandlers={{
                click: () => onSelectAlert && onSelectAlert(alert)
              }}
            >
              <Popup>
                <div className="p-3 w-64">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                    <div className="flex items-center space-x-1.5">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        isPothole ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        #{alert.alert_code}
                      </span>
                      <span className="text-xs font-bold text-slate-900">
                        {isPothole ? 'Road Defect' : 'Vehicle Density'}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">
                      {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>

                  {alert.annotated_image_url && (
                    <img
                      src={alert.annotated_image_url}
                      alt="Defect Evidence"
                      className="w-full h-28 object-cover rounded-lg border border-slate-200 mb-2"
                    />
                  )}

                  <div className="text-xs text-slate-700 font-medium mb-1">
                    📍 {alert.location_name}
                  </div>
                  <div className="text-[11px] text-slate-500 mb-2">
                    Source: <b className="text-slate-900">{alert.bus_id}</b> ({alert.route_id}) · Conf: <b>{(alert.confidence * 100).toFixed(1)}%</b>
                  </div>

                  <button
                    onClick={() => onSelectAlert && onSelectAlert(alert)}
                    className="w-full bg-slate-900 text-white text-xs font-semibold py-1.5 rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    Inspect AI Evidence Artifact →
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}

      </MapContainer>
    </div>
  );
}
