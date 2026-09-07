import React from 'react';
import {
  Disc,
  Droplets,
  Layers,
  Wrench,
  Trash2,
  Footprints,
  Compass,
  Car,
  Users,
  ShieldAlert,
  Flame,
  Camera,
  CheckCircle2,
  ChevronRight,
  Video
} from 'lucide-react';

export default function Sidebar({
  activeTab = 'command',
  onSelectTab = () => {},
  activeCity = 'hyderabad',
  selectedCategory = 'all',
  onSelectCategory = () => {},
  alerts = [],
  stats = null,
  activeBus = null,
  isPlaying = false
}) {
  // Compute counts for categories from live alerts
  const countByType = (types) => {
    if (!Array.isArray(types)) types = [types];
    return alerts.filter((a) => types.includes(a.alert_type)).length;
  };

  const roadCounts = {
    all_road: alerts.filter((a) =>
      ['pothole', 'water_logging', 'road_crack', 'road_damage', 'garbage', 'missing_divider', 'zebra_fading'].includes(
        a.alert_type
      )
    ).length,
    potholes: countByType('pothole'),
    water_logging: countByType('water_logging'),
    missing_divider: countByType('missing_divider'),
    damaged_road: countByType(['road_crack', 'road_damage']),
    garbage: countByType('garbage'),
    zebra_fading: countByType('zebra_fading')
  };

  const trafficCounts = {
    all_traffic: countByType(['vehicle_density', 'congestion']),
    congestion: countByType('congestion'),
    vehicle_density: countByType('vehicle_density')
  };

  const safetyCounts = {
    all_safety: countByType(['overloaded_two_wheeler', 'helmet_violation', 'rash_driving', 'accident']),
    overloaded_two_wheeler: countByType('overloaded_two_wheeler'),
    helmet_violation: countByType('helmet_violation'),
    accident: countByType(['accident', 'rash_driving'])
  };

  const securityCounts = {
    watchlist_match: countByType('watchlist_match')
  };

  const handleCategoryClick = (catId) => {
    onSelectCategory(catId);
    if (activeTab !== 'command') {
      onSelectTab('command');
    }
  };

  return (
    <aside className="w-80 md:w-84 bg-white border-r border-slate-200 flex flex-col shrink-0 h-[calc(100vh-57px)] overflow-hidden">
      {/* 1. TOP TAB BAR: SHOWING TAB NAMES (Command Center vs Simulation Screen) */}
      <div className="p-3 border-b border-slate-200 bg-slate-50/70 space-y-1.5 shrink-0">
        <div className="text-[10px] font-mono font-extrabold uppercase tracking-wider text-slate-400 mb-2 px-1 flex items-center justify-between">
          <span>SYSTEM VIEWS</span>
          <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 text-[9px]">
            EDGE ONLINE
          </span>
        </div>

        {/* Tab Name 1: Command Center */}
        <button
          onClick={() => onSelectTab('command')}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
            activeTab === 'command'
              ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-500'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <div className="flex items-center space-x-2.5">
            <Compass className="w-4 h-4" />
            <span>Command Center</span>
          </div>
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
              activeTab === 'command' ? 'bg-blue-700 text-blue-100' : 'bg-slate-100 text-slate-500'
            }`}
          >
            Map & Table
          </span>
        </button>

        {/* Tab Name 2: Simulation (Opens in Separate Screen) */}
        <button
          onClick={() => onSelectTab('simulation')}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
            activeTab === 'simulation'
              ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-500'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <div className="flex items-center space-x-2.5">
            <Camera className="w-4 h-4 text-blue-500" />
            <span>Simulation</span>
          </div>
          <span
            className={`flex items-center space-x-1.5 text-[10px] px-2 py-0.5 rounded font-bold ${
              isPlaying
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 animate-pulse'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isPlaying ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
            <span>{isPlaying ? 'LIVE' : 'STANDBY'}</span>
          </span>
        </button>
      </div>

      {/* 2. SCROLLABLE EDGE-AI CATEGORY CHANNELS */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Stream Filter: All Events */}
        <button
          onClick={() => handleCategoryClick('all')}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            selectedCategory === 'all'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-slate-100/90 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4" />
            <span>ALL EDGE AI DETECTIONS</span>
          </div>
          <span
            className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
              selectedCategory === 'all' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
            }`}
          >
            {alerts.length}
          </span>
        </button>

        {/* GROUP A: ROAD & INFRASTRUCTURE */}
        <div>
          <div className="flex items-center justify-between px-2 mb-1.5 text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
            <span>ROAD & INFRASTRUCTURE</span>
            <span className="text-slate-500">{roadCounts.all_road}</span>
          </div>
          <div className="space-y-1">
            <CategoryButton
              id="potholes"
              label="Potholes"
              icon={Disc}
              count={roadCounts.potholes}
              badgeColor="bg-red-100 text-red-700"
              active={selectedCategory === 'potholes'}
              onClick={handleCategoryClick}
            />
            <CategoryButton
              id="water_logging"
              label="Water logging"
              icon={Droplets}
              count={roadCounts.water_logging}
              badgeColor="bg-blue-100 text-blue-700"
              active={selectedCategory === 'water_logging'}
              onClick={handleCategoryClick}
            />
            <CategoryButton
              id="missing_divider"
              label="Divider missing"
              icon={Layers}
              count={roadCounts.missing_divider}
              badgeColor="bg-amber-100 text-amber-700"
              active={selectedCategory === 'missing_divider'}
              onClick={handleCategoryClick}
            />
            <CategoryButton
              id="damaged_road"
              label="Damaged road & cracks"
              icon={Wrench}
              count={roadCounts.damaged_road}
              badgeColor="bg-orange-100 text-orange-700"
              active={selectedCategory === 'damaged_road'}
              onClick={handleCategoryClick}
            />
            <CategoryButton
              id="garbage"
              label="Roadside Waste / Garbage"
              icon={Trash2}
              count={roadCounts.garbage}
              badgeColor="bg-stone-100 text-stone-700"
              active={selectedCategory === 'garbage'}
              onClick={handleCategoryClick}
            />
            <CategoryButton
              id="zebra_fading"
              label="Zebra crossing fading"
              icon={Footprints}
              count={roadCounts.zebra_fading}
              badgeColor="bg-yellow-100 text-yellow-800"
              active={selectedCategory === 'zebra_fading'}
              onClick={handleCategoryClick}
            />
          </div>
        </div>

        {/* GROUP B: TRAFFIC & FLOW */}
        <div>
          <div className="flex items-center justify-between px-2 mb-1.5 text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
            <span>TRAFFIC & FLOW</span>
            <span className="text-slate-500">{trafficCounts.all_traffic}</span>
          </div>
          <div className="space-y-1">
            <CategoryButton
              id="congestion"
              label="Congestion"
              icon={Car}
              count={trafficCounts.congestion}
              badgeColor="bg-orange-100 text-orange-700"
              active={selectedCategory === 'congestion'}
              onClick={handleCategoryClick}
            />
            <CategoryButton
              id="vehicle_density"
              label="Vehicle density spikes"
              icon={Users}
              count={trafficCounts.vehicle_density}
              badgeColor="bg-blue-100 text-blue-700"
              active={selectedCategory === 'vehicle_density'}
              onClick={handleCategoryClick}
            />
          </div>
        </div>

        {/* GROUP C: SAFETY & VIOLATIONS */}
        <div>
          <div className="flex items-center justify-between px-2 mb-1.5 text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
            <span>SAFETY VIOLATIONS</span>
            <span className="text-slate-500">{safetyCounts.all_safety}</span>
          </div>
          <div className="space-y-1">
            <CategoryButton
              id="overloaded_two_wheeler"
              label="Overloaded Two-Wheelers (>2)"
              icon={Users}
              count={safetyCounts.overloaded_two_wheeler}
              badgeColor="bg-purple-100 text-purple-700 font-bold"
              active={selectedCategory === 'overloaded_two_wheeler'}
              onClick={handleCategoryClick}
            />
            <CategoryButton
              id="helmet_violation"
              label="Helmet violations"
              icon={ShieldAlert}
              count={safetyCounts.helmet_violation}
              badgeColor="bg-amber-100 text-amber-800"
              active={selectedCategory === 'helmet_violation'}
              onClick={handleCategoryClick}
            />
            <CategoryButton
              id="accident"
              label="Accident & Rash driving"
              icon={Flame}
              count={safetyCounts.accident}
              badgeColor="bg-red-600 text-white font-extrabold"
              active={selectedCategory === 'accident'}
              onClick={handleCategoryClick}
            />
          </div>
        </div>

        {/* GROUP D: SECURITY & ANPR WATCHLIST */}
        <div>
          <div className="flex items-center justify-between px-2 mb-1.5 text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
            <span>SECURITY / ANPR</span>
            <span className="text-slate-500">{securityCounts.watchlist_match}</span>
          </div>
          <div className="space-y-1">
            <CategoryButton
              id="watchlist_match"
              label="Watchlist Hits (P0)"
              icon={ShieldAlert}
              count={securityCounts.watchlist_match}
              badgeColor="bg-red-600 text-white font-extrabold animate-pulse"
              active={selectedCategory === 'watchlist_match'}
              onClick={handleCategoryClick}
            />
          </div>
        </div>
      </div>

      {/* 3. BOTTOM FOOTER TELEMETRY */}
      <div className="p-3 border-t border-slate-200 bg-slate-50 text-[11px] font-mono text-slate-500 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>Local SQLite: OK</span>
        </div>
        <span className="text-slate-400">Node: {activeBus?.bus_label || 'HYD-101'}</span>
      </div>
    </aside>
  );
}

function CategoryButton({ id, label, icon: Icon, count = 0, badgeColor, active, onClick }) {
  return (
    <button
      onClick={() => onClick(id)}
      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
        active
          ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200 shadow-2xs'
          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
      }`}
    >
      <div className="flex items-center space-x-2 truncate">
        <Icon className={`w-3.5 h-3.5 shrink-0 ${active ? 'text-blue-600' : 'text-slate-400'}`} />
        <span className="truncate">{label}</span>
      </div>
      <span
        className={`text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded-full shrink-0 ml-1.5 ${
          badgeColor || 'bg-slate-100 text-slate-600'
        }`}
      >
        {count}
      </span>
    </button>
  );
}
