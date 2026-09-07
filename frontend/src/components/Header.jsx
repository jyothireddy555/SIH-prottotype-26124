import React, { useState } from 'react';
import {
  MapPin,
  Bus,
  ShieldAlert,
  Search,
  ClipboardList,
  RotateCcw,
  Upload,
  RefreshCw,
  LogOut,
  ChevronDown,
  Check,
  Video
} from 'lucide-react';

export default function Header({
  activeCity = 'hyderabad',
  onSelectCity = () => {},
  onOpenWatchlist = () => {},
  onOpenSignboards = () => {},
  onOpenUpload = () => {},
  onReset = () => {},
  onRefresh = () => {},
  stats = null,
  activeTab = 'command',
  onSelectTab = () => {}
}) {
  const [cityMenuOpen, setCityMenuOpen] = useState(false);

  const cities = [
    { id: 'hyderabad', name: 'Hyderabad', state: 'Telangana', hub: 'Hitec City & Financial District' },
    { id: 'pune', name: 'Pune', state: 'Maharashtra', hub: 'Hinjewadi & Nagar Road Corridor' }
  ];

  const currentCityObj = cities.find((c) => c.id === activeCity) || cities[0];

  return (
    <header className="bg-white border-b border-slate-200 px-4 lg:px-6 py-2.5 sticky top-0 z-30 shadow-xs">
      <div className="flex items-center justify-between gap-4">
        {/* 1. LEFT: Location / Independent City Selector matching Wireframe */}
        <div className="flex items-center space-x-3">
          {/* City Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setCityMenuOpen(!cityMenuOpen)}
              className="flex items-center space-x-2 px-3 py-1.5 rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100 transition-all font-sans text-xs font-bold text-slate-900 shadow-2xs"
              title="Select Independent City Command Center"
            >
              <MapPin className="w-4 h-4 text-red-600 fill-red-100" />
              <span className="text-sm tracking-tight">{currentCityObj.name}</span>
              <span className="text-[10px] uppercase font-mono font-bold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                {activeCity === 'hyderabad' ? 'TSRTC' : 'PMPML'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            </button>

            {cityMenuOpen && (
              <div className="absolute left-0 top-full mt-1.5 w-64 bg-white border border-slate-200 rounded-xl shadow-lg z-50 p-1.5">
                <div className="text-[10px] font-mono uppercase text-slate-400 font-bold px-2 py-1">
                  Independent Command Centers
                </div>
                {cities.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      onSelectCity(c.id);
                      setCityMenuOpen(false);
                    }}
                    className={`w-full flex items-start justify-between p-2 rounded-lg text-left transition-colors ${
                      activeCity === c.id ? 'bg-blue-50 text-blue-900' : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-red-500" />
                        <span>{c.name}, {c.state}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">{c.hub}</div>
                    </div>
                    {activeCity === c.id && <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="hidden xl:flex items-center space-x-2 pl-3 border-l border-slate-200 text-xs text-slate-500 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>3 Edge Buses Online</span>
          </div>
        </div>

        {/* 2. CENTER: Exact Wireframe Title "Moving Sensors Device" */}
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2">
            <h1 className="text-base lg:text-lg font-extrabold text-slate-900 tracking-tight font-serif italic">
              Moving Sensors Device
            </h1>
            <span className="text-[9px] font-mono uppercase font-extrabold bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200 hidden sm:inline-block">
              AI EDGE PLATFORM
            </span>
          </div>
          <p className="text-[10px] text-slate-500 font-medium hidden md:block">
            Centralized Mobile Edge-AI Urban Transit & Infrastructure Network
          </p>
        </div>

        {/* 3. RIGHT: Action Buttons matching Wireframe [Home] [Alerts] [Logout] */}
        <div className="flex items-center space-x-1.5 sm:space-x-2">
          {/* [ Home ] */}
          <button
            onClick={() => onSelectTab('command')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold font-sans transition-all cursor-pointer ${
              activeTab === 'command'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Home
          </button>

          {/* [ Simulation ] */}
          <button
            onClick={() => onSelectTab('simulation')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold font-sans transition-all flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'simulation'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Video className="w-3.5 h-3.5 text-blue-500" />
            <span>Simulation</span>
          </button>

          {/* [ Alerts ] */}
          <button
            onClick={() => onSelectTab('potholes')}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all"
          >
            <span>Alerts</span>
            {(stats?.critical_severity_count || 0) > 0 && (
              <span className="bg-red-600 text-white text-[10px] font-mono font-extrabold px-1.5 py-0.2 rounded-full">
                {stats.critical_severity_count}
              </span>
            )}
          </button>

          {/* [ Watchlist ] */}
          <button
            onClick={onOpenWatchlist}
            className="hidden sm:flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all"
            title="Maintain Number Plate Watchlist"
          >
            <Search className="w-3.5 h-3.5 text-slate-500" />
            <span>Watchlist</span>
          </button>

          {/* [ Signboards ] */}
          <button
            onClick={onOpenSignboards}
            className="hidden md:flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all"
            title="Signboard Historical Inventory"
          >
            <ClipboardList className="w-3.5 h-3.5 text-slate-500" />
            <span>Signboards</span>
          </button>

          {/* [ Manual Upload ] */}
          <button
            onClick={onOpenUpload}
            className="hidden lg:flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all"
            title="Upload External Frame / Video"
          >
            <Upload className="w-3.5 h-3.5 text-slate-500" />
            <span>Upload</span>
          </button>

          {/* [ Logout / Reset ] */}
          <button
            onClick={onReset}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition-all"
            title="Clean Slate Demo Reset"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-600" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </div>
    </header>
  );
}
