import React, { useState, useEffect, useRef } from 'react';
import { api } from './api';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import LiveMap from './components/LiveMap';
import BusVideoHUD from './components/BusVideoHUD';
import ActivityTicker from './components/ActivityTicker';
import IncidentDrawer from './components/IncidentDrawer';
import BusDetailDrawer from './components/BusDetailDrawer';
import AIAgentsDrawer from './components/AIAgentsDrawer';
import AnalyticsView from './components/AnalyticsView';
import ManualUploadModal from './components/ManualUploadModal';
import { Disc, Car, Bus, Filter, AlertCircle, ArrowUpRight } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('command');
  const [stats, setStats] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [buses, setBuses] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [simStatus, setSimStatus] = useState(null);
  const [activeBusId, setActiveBusId] = useState('BUS-104');
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState('1x');
  const [latestDetection, setLatestDetection] = useState(null);

  // Drawer states
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [selectedBus, setSelectedBus] = useState(null);
  const [showAgentsModal, setShowAgentsModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [systemInfo, setSystemInfo] = useState(null);

  // Filters for subviews
  const [severityFilter, setSeverityFilter] = useState('ALL');

  const simIntervalRef = useRef(null);

  // Fetch initial data via unified aggregate endpoint
  const loadAllData = async () => {
    try {
      const data = await api.getDashboardData(50);
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
    loadAllData();
    const interval = setInterval(loadAllData, 3500);
    return () => clearInterval(interval);
  }, []);

  // Switch Active Bus Function
  const handleSelectBusId = async (busId) => {
    setActiveBusId(busId);
    try {
      await api.setSimBus(busId);
      const updatedSim = await api.getSimStatus();
      setSimStatus(updatedSim);
      loadAllData();
    } catch (e) {
      console.error('Failed to set active bus:', e);
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
      const res = await api.sendLiveFrame({
        bus_id: activeBusId,
        image_base64: imageBase64,
        progress: progress,
        speed_kmh: activeBus?.speed_kmh || 32.0,
        lat: activeBus?.current_lat,
        lng: activeBus?.current_lng,
        location_name: activeBus?.route_name
      });
      if (res && res.detection) {
        setLatestDetection(res.detection);
      }
      loadAllData();
    } catch (e) {
      console.error('Live frame error:', e);
    }
  };

  // Step simulation logic
  const handleStepSimulation = async () => {
    try {
      const res = await api.stepSim();
      if (res && res.detection) {
        setLatestDetection(res.detection);
      }
      loadAllData();
    } catch (e) {
      console.error('Simulation step error:', e);
    }
  };

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
      await loadAllData();
      setResetToast("✨ Fresh Jury Demo Mode Initialized: All historical alerts cleared. Click [START BUS RUN] to begin live AI detection!");
      setTimeout(() => setResetToast(null), 5000);
    } catch (e) {
      console.error('Reset error:', e);
    }
  };

  const handleUpdateStatus = async (alertId, action) => {
    try {
      await api.updateAlertAction(alertId, action);
      loadAllData();
      if (selectedIncident && selectedIncident.id === alertId) {
        const updated = await api.getAlertDetail(alertId);
        setSelectedIncident(updated);
      }
    } catch (e) {
      console.error('Action error:', e);
    }
  };

  const activeBus = buses.find(b => b.bus_label === activeBusId) || buses[0] || {
    id: 1,
    bus_label: activeBusId,
    bus_number: activeBusId === 'BUS-218' ? 'MH-12-AB-218' : activeBusId === 'BUS-301' ? 'MH-12-TR-301' : 'MH-12-RN-104',
    speed_kmh: 34.0,
    route_id: activeBusId === 'BUS-218' ? 'Route 500D' : activeBusId === 'BUS-301' ? 'Route 335E' : 'Route 115',
    route_name: activeBusId === 'BUS-218' ? 'Pune Monsoon City Corridor' : activeBusId === 'BUS-301' ? 'Highway Traffic Flow' : 'Sus Road & Pashan Corridor',
    current_lat: 18.5284,
    current_lng: 73.8743,
    total_potholes: 5,
    total_vehicles: 82,
    total_detections: 18
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-slate-900 flex flex-col font-sans">
      
      {/* 1. Light Antigravity-Style Header */}
      <Header
        simStatus={simStatus}
        isPlaying={isPlaying}
        onTogglePlay={handleTogglePlay}
        onStep={handleStepSimulation}
        onReset={handleReset}
        speed={speed}
        onChangeSpeed={setSpeed}
        onOpenUpload={() => setShowUploadModal(true)}
        onRefresh={loadAllData}
        stats={stats}
        buses={buses}
        activeBusId={activeBusId}
        onSelectBusId={handleSelectBusId}
      />

      {/* Jury Demo Reset Toast Banner */}
      {resetToast && (
        <div className="bg-purple-600 text-white px-6 py-2.5 text-xs font-bold font-mono flex items-center justify-between shadow-md animate-fadeIn">
          <div className="flex items-center space-x-2">
            <span className="bg-white text-purple-700 px-2 py-0.5 rounded text-[10px] uppercase font-sans font-extrabold">JURY DEMO MODE</span>
            <span>{resetToast}</span>
          </div>
          <button onClick={() => setResetToast(null)} className="text-white/80 hover:text-white font-bold ml-4">✕</button>
        </div>
      )}

      {/* 2. Main App Container */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Minimal Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={(tab) => {
            if (tab === 'agents') {
              setShowAgentsModal(true);
            } else {
              setActiveTab(tab);
            }
          }}
          stats={stats}
        />

        {/* Dynamic Center Work Area */}
        <main className="flex-1 flex flex-col min-w-0 bg-[#F8F9FA] overflow-y-auto">
          
          {/* VIEW A: Command Center (Map + Live Video HUD) */}
          {activeTab === 'command' && (
            <div className="flex-1 flex flex-col p-4 space-y-4">
              
              {/* Dual Panel Grid: Onboard Video HUD + Live City Map */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                
                {/* Left/Top: Synchronized Live Onboard Bus Video HUD */}
                <div className="lg:col-span-5 flex flex-col space-y-2 h-[480px]">
                  <div className="flex items-center justify-between px-1 shrink-0">
                    <span className="text-xs font-bold text-slate-700 uppercase font-mono tracking-wider">
                      ONBOARD BUS VISION HUD
                    </span>
                    <span className="text-[10px] text-blue-700 font-mono font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      SYNC WITH MAP
                    </span>
                  </div>
                  
                  <div className="flex-1 h-full rounded-xl overflow-hidden shadow-xs border border-slate-200">
                    <BusVideoHUD
                      activeBus={activeBus}
                      latestDetection={latestDetection}
                      isPlaying={isPlaying}
                      systemInfo={systemInfo}
                      onTogglePlay={handleTogglePlay}
                      onPlayStateChange={(state) => setIsPlaying(state)}
                      onSelectBus={(busId) => {
                        setVideoProgress(0);
                        lastWaypointRef.current = -1;
                        handleSelectBusId(busId);
                      }}
                      onInspectLatest={() => {
                        if (alerts.length > 0) setSelectedIncident(alerts[0]);
                      }}
                      onVideoProgress={handleVideoProgress}
                      onSendLiveFrame={handleSendLiveFrame}
                    />
                  </div>
                </div>

                {/* Right/Bottom: Live City Geographic Map */}
                <div className="lg:col-span-7 flex flex-col space-y-2 h-[480px]">
                  <div className="flex items-center justify-between px-1 shrink-0">
                    <span className="text-xs font-bold text-slate-700 uppercase font-mono tracking-wider">
                      LIVE CITY TRANSIT CORRIDOR MAP
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {activeBus?.route_name || 'Pune Transit Corridor'}
                    </span>
                  </div>
                  
                  <div className="flex-1 h-full rounded-xl overflow-hidden shadow-xs border border-slate-200">
                    <LiveMap
                      alerts={alerts}
                      buses={buses}
                      activeBus={activeBus}
                      isPlaying={isPlaying}
                      videoProgress={videoProgress}
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

              </div>

              {/* Bottom Live AI Activity Ticker */}
              <ActivityTicker
                logs={activityLogs}
                onSelectAlertCode={(code) => {
                  const match = alerts.find(a => a.alert_code === code);
                  if (match) setSelectedIncident(match);
                }}
              />

            </div>
          )}

          {/* VIEW B: Fleet Tracking */}
          {activeTab === 'fleet' && (
            <div className="p-6 space-y-6 max-w-6xl mx-auto w-full">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div>
                  <h1 className="text-lg font-bold text-slate-900">Active Bus Fleet Roving Sensing Network</h1>
                  <p className="text-xs text-slate-500">Real-time edge micro-node telemetry and camera stream status</p>
                </div>
                <span className="text-xs font-mono font-bold bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md border border-blue-200">
                  {buses.length} Mobile Nodes Online
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {buses.map((bus) => (
                  <div
                    key={bus.id}
                    onClick={() => {
                      handleSelectBusId(bus.bus_label);
                      setSelectedBus(bus);
                      setActiveTab('command');
                    }}
                    className={`bg-white border rounded-xl p-5 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer space-y-3 ${
                      activeBusId === bus.bus_label ? 'border-blue-600 ring-2 ring-blue-100 shadow-sm' : 'border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center">
                          <Bus className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-bold text-sm text-slate-900">{bus.bus_label}</div>
                          <div className="text-[11px] font-mono text-slate-400">{bus.bus_number}</div>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">
                        ONLINE
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 font-medium">
                      {bus.route_name}
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center text-xs pt-2 border-t border-slate-100 font-mono">
                      <div className="bg-slate-50 p-2 rounded-lg">
                        <span className="text-[9px] text-slate-400 block">SPEED</span>
                        <b className="text-slate-800">{bus.speed_kmh} km/h</b>
                      </div>
                      <div className="bg-red-50 p-2 rounded-lg">
                        <span className="text-[9px] text-red-500 block">POTHOLES</span>
                        <b className="text-red-700">{bus.total_potholes}</b>
                      </div>
                      <div className="bg-amber-50 p-2 rounded-lg">
                        <span className="text-[9px] text-amber-500 block">VEHICLES</span>
                        <b className="text-amber-700">{bus.total_vehicles}</b>
                      </div>
                    </div>

                    <button className="w-full mt-2 bg-slate-900 text-white text-xs font-semibold py-1.5 rounded-lg hover:bg-slate-800 transition-colors">
                      Switch Live Feed to {bus.bus_label} →
                    </button>
                  </div>
                ))}
              </div>

              {/* Map Preview for fleet */}
              <div className="h-80 w-full rounded-xl overflow-hidden border border-slate-200">
                <LiveMap 
                  alerts={alerts} 
                  buses={buses} 
                  activeBus={activeBus} 
                  isPlaying={isPlaying}
                  onSelectBus={(b) => {
                    handleSelectBusId(b.bus_label);
                    setSelectedBus(b);
                  }} 
                />
              </div>
            </div>
          )}

          {/* VIEW C: Road Defects Priority Queue */}
          {activeTab === 'potholes' && (
            <div className="p-6 space-y-6 max-w-6xl mx-auto w-full">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                <div>
                  <h1 className="text-lg font-bold text-slate-900">Road Defect & Pothole Priority Queue</h1>
                  <p className="text-xs text-slate-500">Autonomous edge detections ranked by severity and municipal hazard score</p>
                </div>
                
                {/* Severity Filter */}
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

              {/* Incidents Table / Cards */}
              <div className="space-y-3">
                {alerts
                  .filter(a => a.alert_type === 'pothole')
                  .filter(a => severityFilter === 'ALL' || a.severity === severityFilter)
                  .map((alert) => (
                    <div
                      key={alert.id}
                      onClick={() => setSelectedIncident(alert)}
                      className="bg-white border border-slate-200 rounded-xl p-4 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="flex items-center space-x-3.5">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 ${
                          alert.severity === 'CRITICAL' ? 'bg-red-600' : 'bg-rose-500'
                        }`}>
                          <Disc className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-mono font-bold text-xs bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200">
                              #{alert.alert_code}
                            </span>
                            <span className="text-xs font-bold text-slate-900">
                              {alert.location_name}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              alert.status === 'DISPATCHED' ? 'bg-purple-100 text-purple-700' :
                              alert.status === 'VERIFIED' ? 'bg-blue-100 text-blue-700' :
                              alert.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-700' :
                              'bg-amber-100 text-amber-700'
                            }`}>
                              ● {alert.status}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-1">
                            Reported by <b>{alert.bus_id}</b> · Est Depth: <b>{alert.defect_depth_est}</b> · Area: <b>{alert.defect_area_est}</b>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4 shrink-0">
                        <div className="text-right">
                          <div className="text-xs font-mono font-bold text-red-600">
                            {alert.severity} SEVERITY
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            {(alert.confidence * 100).toFixed(1)}% Conf
                          </div>
                        </div>
                        <div className="text-slate-400 group-hover:text-slate-900">
                          <ArrowUpRight className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* VIEW D: Traffic Density */}
          {activeTab === 'traffic' && (
            <div className="p-6 space-y-6 max-w-6xl mx-auto w-full">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div>
                  <h1 className="text-lg font-bold text-slate-900">Vehicular Flow & Traffic Density Monitor</h1>
                  <p className="text-xs text-slate-500">Autonomous multi-class vehicle detection per frame (Cars, Buses, Trucks, Motorcycles)</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {alerts.filter(a => a.alert_type === 'vehicle_density').map((alert) => (
                  <div
                    key={alert.id}
                    onClick={() => setSelectedIncident(alert)}
                    className="bg-white border border-slate-200 rounded-xl p-4 hover:border-amber-400 hover:shadow-md transition-all cursor-pointer space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200">
                          <Car className="w-4 h-4" />
                        </div>
                        <span className="font-bold text-xs text-slate-900">
                          {alert.location_name}
                        </span>
                      </div>
                      <span className="font-mono text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        {alert.vehicle_count} Vehicles
                      </span>
                    </div>

                    <div className="text-xs text-slate-600">
                      Reporting bus: <b>{alert.bus_id}</b> ({alert.route_id})
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* VIEW E: Analytics View */}
          {activeTab === 'analytics' && (
            <AnalyticsView stats={stats} alerts={alerts} />
          )}

        </main>

      </div>

      {/* 3. Contextual Artifact Drawers */}
      {selectedIncident && (
        <IncidentDrawer
          incident={selectedIncident}
          onClose={() => setSelectedIncident(null)}
          onUpdateStatus={handleUpdateStatus}
        />
      )}

      {selectedBus && (
        <BusDetailDrawer
          bus={selectedBus}
          onClose={() => setSelectedBus(null)}
          alerts={alerts}
        />
      )}

      {showAgentsModal && (
        <AIAgentsDrawer onClose={() => setShowAgentsModal(false)} />
      )}

      {showUploadModal && (
        <ManualUploadModal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          onSuccess={(res) => {
            loadAllData();
          }}
        />
      )}

    </div>
  );
}
