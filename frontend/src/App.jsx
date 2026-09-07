import React, { useState, useEffect, useRef } from 'react';
import { api } from './api';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import SimulationView from './components/SimulationView';
import LiveMap, { 
  route115Coords, 
  route500DCoords, 
  route335ECoords,
  route216Coords,
  route10HCoords,
  route5KCoords,
  interpolatePositionAlongRoute 
} from './components/LiveMap';
import PriorityTable from './components/PriorityTable';
import WatchlistModal from './components/WatchlistModal';
import SignboardsModal from './components/SignboardsModal';
import IncidentDrawer from './components/IncidentDrawer';
import BusDetailDrawer from './components/BusDetailDrawer';
import AIAgentsDrawer from './components/AIAgentsDrawer';
import AnalyticsView from './components/AnalyticsView';
import ManualUploadModal from './components/ManualUploadModal';
import { Disc, Car, Bus, Filter, AlertCircle, ArrowUpRight } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('command');
  const [activeCity, setActiveCity] = useState('hyderabad');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeCamera, setActiveCamera] = useState('CAM-1-FRONT');

  const [stats, setStats] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [buses, setBuses] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [simStatus, setSimStatus] = useState(null);
  const [activeBusId, setActiveBusId] = useState('HYD-101');
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState('1x');
  const [latestDetection, setLatestDetection] = useState(null);

  // Modal / Drawer states
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [selectedBus, setSelectedBus] = useState(null);
  const [showAgentsModal, setShowAgentsModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showWatchlistModal, setShowWatchlistModal] = useState(false);
  const [showSignboardsModal, setShowSignboardsModal] = useState(false);
  const [systemInfo, setSystemInfo] = useState(null);

  // Filters for subviews
  const [severityFilter, setSeverityFilter] = useState('ALL');

  const simIntervalRef = useRef(null);

  // Fetch initial data via unified aggregate endpoint
  const loadAllData = async (cityToLoad = activeCity) => {
    try {
      const data = await api.getDashboardData(50, cityToLoad);
      if (data) {
        if (data.stats) setStats(data.stats);
        if (data.alerts) setAlerts(data.alerts);
        if (data.fleet) setBuses(data.fleet);
        if (data.activity_logs) setActivityLogs(data.activity_logs);
        if (data.sim_status) setSimStatus(data.sim_status);
        if (data.system_info) setSystemInfo(data.system_info);
      }
    } catch (e) {
      console.error('Error fetching dashboard data:', e);
    }
  };

  useEffect(() => {
    loadAllData(activeCity);
    const interval = setInterval(() => loadAllData(activeCity), 3500);
    return () => clearInterval(interval);
  }, [activeCity]);

  // Switch Active City Function (Independent Command Center Model)
  const handleSelectCity = async (cityId) => {
    const nextCity = cityId.toLowerCase();
    setActiveCity(nextCity);
    const defaultBus = nextCity === 'hyderabad' ? 'HYD-101' : 'BUS-104';
    setActiveBusId(defaultBus);
    setVideoProgress(0);
    setLatestDetection(null);
    lastWaypointRef.current = -1;
    try {
      await api.setSimCity(nextCity);
      await loadAllData(nextCity);
    } catch (e) {
      console.error('Failed to set active city:', e);
    }
  };

  // Switch Active Bus Function (Each bus is an independent, distinct route run)
  const handleSelectBusId = async (busId) => {
    setActiveBusId(busId);
    setVideoProgress(0);
    setLatestDetection(null);
    lastWaypointRef.current = -1;
    try {
      await api.setSimBus(busId);
      const updatedSim = await api.getSimStatus();
      setSimStatus(updatedSim);
      loadAllData(activeCity);
    } catch (e) {
      console.error('Failed to set active bus:', e);
    }
  };

  // Switch Active Camera Angle
  const handleSelectCamera = async (camId) => {
    setActiveCamera(camId);
    try {
      await api.setSimCamera(camId);
    } catch (e) {
      console.error('Failed to switch camera:', e);
    }
  };

  const [videoProgress, setVideoProgress] = useState(0);
  const lastWaypointRef = useRef(-1);

  // Video progress callback: synchronizes map bus position
  const handleVideoProgress = (progress, currTime, duration) => {
    setVideoProgress(progress);
  };

  // Direct Live Frame Ingestion: Sends exact canvas frame to YOLO model
  const handleSendLiveFrame = async (imageBase64, progress, currentTime) => {
    try {
      const routeCoordsMap = {
        'HYD-101': route216Coords,
        'HYD-204': route10HCoords,
        'HYD-305': route5KCoords,
        'BUS-104': route115Coords,
        'BUS-218': route500DCoords,
        'BUS-301': route335ECoords
      };
      const activeRoute = routeCoordsMap[activeBusId] || route216Coords;
      const [exactLat, exactLng] = interpolatePositionAlongRoute(activeRoute, progress);

      const res = await api.sendLiveFrame({
        bus_id: activeBusId,
        image_base64: imageBase64,
        progress: progress,
        speed_kmh: activeBus?.speed_kmh || 32.0,
        lat: exactLat,
        lng: exactLng,
        location_name: activeBus?.route_name
      });
      if (res && res.detection) {
        setLatestDetection(res.detection);
      }
    } catch (e) {
      console.error('Live frame error:', e);
    }
  };

  // Step simulation logic — synced to video timeline position
  const handleStepSimulation = async () => {
    try {
      const routeCoordsMap = {
        'HYD-101': route216Coords,
        'HYD-204': route10HCoords,
        'HYD-305': route5KCoords,
        'BUS-104': route115Coords,
        'BUS-218': route500DCoords,
        'BUS-301': route335ECoords
      };
      const activeRoute = routeCoordsMap[activeBusId] || route216Coords;
      const [exactLat, exactLng] = interpolatePositionAlongRoute(activeRoute, videoProgress);

      const res = await api.stepSim(videoProgress, exactLat, exactLng);
      if (res && res.detection) {
        setLatestDetection(res.detection);
      }
      await loadAllData(activeCity);
    } catch (e) {
      console.error('Simulation step error:', e);
    }
  };

  // Continuous Play/Pause Simulation Controller
  const startDelayRef = useRef(null);
  useEffect(() => {
    if (isPlaying) {
      const intervalMs = speed === '3x' ? 1200 : speed === '2x' ? 2000 : 3000;
      startDelayRef.current = setTimeout(() => {
        handleStepSimulation();
        simIntervalRef.current = setInterval(handleStepSimulation, intervalMs);
      }, 150);
    } else {
      if (simIntervalRef.current) clearInterval(simIntervalRef.current);
      if (startDelayRef.current) clearTimeout(startDelayRef.current);
    }
    return () => {
      if (simIntervalRef.current) clearInterval(simIntervalRef.current);
      if (startDelayRef.current) clearTimeout(startDelayRef.current);
    };
  }, [isPlaying, speed, activeBusId, activeCity]);

  const handleTogglePlay = async () => {
    const nextState = !isPlaying;
    setIsPlaying(nextState);
    try {
      await api.toggleSimPlay(nextState);
    } catch (e) {}
  };

  const [resetToast, setResetToast] = useState(null);

  const handleReset = async () => {
    setIsPlaying(false);
    setVideoProgress(0);
    lastWaypointRef.current = -1;
    try {
      await api.resetSim(true);
      setLatestDetection(null);
      await loadAllData(activeCity);
      setResetToast("✨ Clean Slate Initialized: All temporary detections reset. Edge AI Nodes ready.");
      setTimeout(() => setResetToast(null), 5000);
    } catch (e) {
      console.error('Reset error:', e);
    }
  };

  const handleUpdateStatus = async (alertId, action) => {
    try {
      await api.updateAlertAction(alertId, action);
      loadAllData(activeCity);
      if (selectedIncident && selectedIncident.id === alertId) {
        const updated = await api.getAlertDetail(alertId);
        setSelectedIncident(updated);
      }
    } catch (e) {
      console.error('Update status error:', e);
    }
  };

  const activeBus = buses.find((b) => b.bus_label === activeBusId) || {
    bus_label: activeBusId,
    route_id: activeCity === 'hyderabad' ? 'Route 216' : 'Route 115',
    route_name: activeCity === 'hyderabad' ? 'Gachibowli - Hitec City Corridor' : 'Sus Road - Pashan - Hinjewadi',
    speed_kmh: 32.0,
    current_lat: activeCity === 'hyderabad' ? 17.4435 : 18.5380,
    current_lng: activeCity === 'hyderabad' ? 78.3772 : 73.7850
  };

  return (
    <div className="flex flex-col h-screen bg-[#F8F9FA] text-slate-900 font-sans antialiased overflow-hidden">
      {/* 1. Header Bar matching Wireframe: [📍 City] [Moving Sensors Device] [Home] [Alerts] [Logout] */}
      <Header
        activeCity={activeCity}
        onSelectCity={handleSelectCity}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenWatchlist={() => setShowWatchlistModal(true)}
        onOpenSignboards={() => setShowSignboardsModal(true)}
        onOpenUpload={() => setShowUploadModal(true)}
        onReset={handleReset}
        onRefresh={() => loadAllData(activeCity)}
        stats={stats}
      />

      {/* Demo Toast Notification */}
      {resetToast && (
        <div className="bg-purple-600 text-white px-6 py-2.5 text-xs font-bold font-mono flex items-center justify-between shadow-md animate-fadeIn shrink-0 z-40">
          <div className="flex items-center space-x-2">
            <span className="bg-white text-purple-700 px-2 py-0.5 rounded text-[10px] uppercase font-sans font-extrabold">DEMO MODE</span>
            <span>{resetToast}</span>
          </div>
          <button onClick={() => setResetToast(null)} className="text-white/80 hover:text-white font-bold ml-4">✕</button>
        </div>
      )}

      {/* 2. Main Work Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* COLUMN 1: LEFT TAB BAR & CATEGORIES (Persistent for Command Center & Simulation) */}
        {(activeTab === 'command' || activeTab === 'simulation') && (
          <Sidebar
            activeTab={activeTab}
            onSelectTab={(tab) => setActiveTab(tab)}
            activeCity={activeCity}
            selectedCategory={selectedCategory}
            onSelectCategory={(cat) => setSelectedCategory(cat)}
            alerts={alerts}
            stats={stats}
            activeBus={activeBus}
            isPlaying={isPlaying}
          />
        )}

        {/* VIEW A: Command Center (Center Map + Right Priority Table) */}
        {activeTab === 'command' && (
          <div className="flex-1 flex overflow-hidden">
            {/* COLUMN 2: CENTER MAP */}
            <div className="flex-1 flex flex-col p-3 min-w-0 bg-[#F1F3F5] overflow-hidden">
              <div className="flex-1 rounded-xl overflow-hidden shadow-xs border border-slate-200 bg-white">
                <LiveMap
                  activeCity={activeCity}
                  selectedCategory={selectedCategory}
                  alerts={alerts}
                  buses={buses}
                  activeBus={activeBus}
                  isPlaying={isPlaying}
                  videoProgress={videoProgress}
                  selectedIncident={selectedIncident}
                  onSelectAlert={(al) => setSelectedIncident(al)}
                  onSelectBus={(b) => {
                    setVideoProgress(0);
                    lastWaypointRef.current = -1;
                    handleSelectBusId(b.bus_label);
                    setSelectedBus(b);
                  }}
                />
              </div>
            </div>

            {/* COLUMN 3: RIGHT PRIORITY TABLE (Matching Wireframe Columns: #, Lat:Long, Last viewed, No of times, Risk) */}
            <div className="w-96 lg:w-[420px] p-3 pl-0 flex flex-col shrink-0 bg-[#F1F3F5] overflow-hidden">
              <PriorityTable
                alerts={alerts}
                selectedCategory={selectedCategory}
                selectedIncident={selectedIncident}
                onSelectIncident={(al) => setSelectedIncident(al)}
                onInspectIncident={(al) => setSelectedIncident(al)}
              />
            </div>
          </div>
        )}

        {/* VIEW B: Dedicated Separate Simulation Screen */}
        {activeTab === 'simulation' && (
          <SimulationView
            activeCity={activeCity}
            activeBus={activeBus}
            activeBusId={activeBusId}
            buses={buses}
            activeCamera={activeCamera}
            isPlaying={isPlaying}
            speed={speed}
            latestDetection={latestDetection}
            systemInfo={systemInfo}
            alerts={alerts}
            videoProgress={videoProgress}
            onTogglePlay={handleTogglePlay}
            onStep={handleStepSimulation}
            onChangeSpeed={(s) => setSpeed(s)}
            onSelectBus={(busId) => {
              setVideoProgress(0);
              lastWaypointRef.current = -1;
              handleSelectBusId(busId);
            }}
            onSelectCamera={handleSelectCamera}
            onVideoProgress={handleVideoProgress}
            onSendLiveFrame={handleSendLiveFrame}
            onInspectIncident={(al) => setSelectedIncident(al)}
            onReturnToCommand={() => setActiveTab('command')}
          />
        )}

        {/* VIEW B: Fleet Tracking Large Canvas */}
        {activeTab === 'fleet' && (
          <div className="flex-1 p-4 md:p-6 space-y-4 max-w-7xl mx-auto w-full flex flex-col overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h1 className="text-lg font-bold text-slate-900">Active Bus Fleet Roving Sensing Network · {activeCity.toUpperCase()}</h1>
                <p className="text-xs text-slate-500">Live full-city geospatial tracking across all mobile edge-AI nodes</p>
              </div>
              <div className="flex items-center space-x-2">
                {buses.map((bus) => (
                  <button
                    key={bus.id}
                    onClick={() => {
                      handleSelectBusId(bus.bus_label);
                      setSelectedBus(bus);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                      activeBusId === bus.bus_label
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {bus.bus_label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 min-h-[560px] rounded-2xl overflow-hidden border border-slate-200 shadow-md">
              <LiveMap
                activeCity={activeCity}
                selectedCategory={selectedCategory}
                alerts={alerts}
                buses={buses}
                activeBus={activeBus}
                isPlaying={isPlaying}
                videoProgress={videoProgress}
                selectedIncident={selectedIncident}
                onSelectAlert={(al) => setSelectedIncident(al)}
                onSelectBus={(b) => setSelectedBus(b)}
              />
            </div>
          </div>
        )}

        {/* VIEW C: Road Defects Priority 2-Column Grid */}
        {activeTab === 'potholes' && (
          <div className="flex-1 p-6 space-y-6 max-w-6xl mx-auto w-full overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h1 className="text-lg font-bold text-slate-900">Road Defect & Hazard Priority Grid · {activeCity.toUpperCase()}</h1>
                <p className="text-xs text-slate-500">Autonomous edge detections ranked by severity and municipal hazard score</p>
              </div>
              <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
                {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM'].map((sev) => (
                  <button
                    key={sev}
                    onClick={() => setSeverityFilter(sev)}
                    className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                      severityFilter === sev ? 'bg-white font-bold text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {sev}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {alerts
                .filter((a) => severityFilter === 'ALL' || a.severity === severityFilter)
                .map((alert) => (
                  <div
                    key={alert.id}
                    onClick={() => setSelectedIncident(alert)}
                    className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:border-blue-500 hover:shadow-lg transition-all cursor-pointer flex flex-col justify-between group shadow-xs"
                  >
                    <div className="relative w-full h-44 bg-slate-100 overflow-hidden">
                      <img
                        src={alert.annotated_image_url || alert.raw_image_url || '/uploads/sample_sus_pothole.jpg'}
                        alt={alert.alert_type}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90"
                      />
                      <div className="absolute top-2 left-2 flex items-center space-x-1.5">
                        <span className="bg-white/90 text-slate-800 font-mono text-[10px] font-bold px-2 py-0.5 rounded shadow-xs backdrop-blur-xs border border-slate-200">
                          {alert.alert_code}
                        </span>
                        <span
                          className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded uppercase ${
                            alert.severity === 'CRITICAL'
                              ? 'bg-red-600 text-white'
                              : alert.severity === 'HIGH'
                              ? 'bg-amber-500 text-white'
                              : 'bg-blue-600 text-white'
                          }`}
                        >
                          {alert.severity}
                        </span>
                      </div>
                      <div className="absolute bottom-2 right-2 bg-white/90 text-slate-800 font-mono text-[10px] font-bold px-2 py-0.5 rounded shadow-xs backdrop-blur-xs border border-slate-200">
                        Conf: {(alert.confidence * 100).toFixed(1)}%
                      </div>
                    </div>

                    <div className="p-3.5 space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition-colors">
                          {alert.alert_type.toUpperCase().replace(/_/g, ' ')}
                        </h3>
                        <span className="text-[10px] font-mono text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 font-bold">
                          {alert.sighting_count || 1} Passes
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">{alert.location_name}</p>
                      <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-600 bg-slate-50 p-2 rounded-lg border">
                        <div>Depth: <b className="text-slate-900">{alert.defect_depth_est || 'N/A'}</b></div>
                        <div>Area: <b className="text-slate-900">{alert.defect_area_est || 'N/A'}</b></div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* VIEW D: Urban Analytics */}
        {activeTab === 'analytics' && (
          <div className="flex-1 p-6 max-w-6xl mx-auto w-full overflow-y-auto">
            <AnalyticsView stats={stats} alerts={alerts} />
          </div>
        )}
      </div>

      {/* 3. MODALS & DRAWERS */}
      {/* Evidence Inspection Drawer (Full-Screen or Slide-in) */}
      {selectedIncident && (
        <IncidentDrawer
          incident={selectedIncident}
          isFullScreen={activeTab === 'potholes' || activeTab === 'traffic'}
          onClose={() => setSelectedIncident(null)}
          onUpdateStatus={handleUpdateStatus}
        />
      )}

      {/* Bus Telemetry Drawer */}
      {selectedBus && (
        <BusDetailDrawer
          bus={selectedBus}
          onClose={() => setSelectedBus(null)}
          onSelectBus={(busId) => handleSelectBusId(busId)}
        />
      )}

      {/* Watchlist Manager Modal */}
      <WatchlistModal
        isOpen={showWatchlistModal}
        onClose={() => setShowWatchlistModal(false)}
      />

      {/* Signboard Inventory Modal */}
      <SignboardsModal
        isOpen={showSignboardsModal}
        onClose={() => setShowSignboardsModal(false)}
        activeCity={activeCity}
      />

      {/* AI Agents Modal */}
      {showAgentsModal && (
        <AIAgentsDrawer onClose={() => setShowAgentsModal(false)} />
      )}

      {/* Manual Upload Modal */}
      {showUploadModal && (
        <ManualUploadModal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          onUploadSuccess={() => loadAllData(activeCity)}
        />
      )}
    </div>
  );
}
