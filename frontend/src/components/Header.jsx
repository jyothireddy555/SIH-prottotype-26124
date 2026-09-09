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
  Video,
  Compass,
  BarChart3,
  Sparkles
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
    {
      id: 'hyderabad',
      name: 'Hyderabad',
      state: 'Telangana',
      fleet: '3 Buses (Route 216, 10H, 5K)',
      center: 'Hitec City / Financial Dist'
    },
    {
      id: 'pune',
      name: 'Pune',
      state: 'Maharashtra',
      fleet: '3 Buses (Route 115, 500D, 335E)',
      center: 'Swargate / Hinjawadi'
    }
  ];

  const currentCityObj = cities.find((c) => c.id === activeCity) || cities[0];

  return (
    <header className="bg-white border-b border-slate-200 px-4 py-2 flex items-center justify-between shadow-2xs shrink-0 z-30">
      {/* 1. LEFT: CITY SELECTOR & BRANDING */}
      <div className="flex items-center space-x-3">
        {/* City Location Dropdown */}
        <div className="relative">
          <button
            onClick={() => setCityMenuOpen(!cityMenuOpen)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-bold text-slate-800 hover:bg-slate-100 transition-colors shadow-2xs cursor-pointer"
          >
            <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span className="font-sans font-bold">{currentCityObj.name}</span>
            <span className="text-[10px] text-slate-400 font-normal">({currentCityObj.state})</span>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${cityMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* City Dropdown Menu */}
          {cityMenuOpen && (
            <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-1 animate-in fade-in zoom-in-95">
              <div className="px-3 py-1.5 text-[10px] font-mono uppercase font-bold text-slate-400 border-b border-slate-100">
                Independent City Hub
              </div>
              {cities.map((city) => (
                <button
                  key={city.id}
                  onClick={() => {
                    onSelectCity(city.id);
                    setCityMenuOpen(false);
                  }}
                  className={`w-full text-left p-2.5 rounded-lg text-xs transition-colors flex items-center justify-between cursor-pointer ${
                    activeCity === city.id ? 'bg-blue-50 text-blue-900 font-bold' : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div>
                    <div className="font-bold flex items-center space-x-1.5">
                      <span>{city.name}</span>
                      <span className="text-[10px] text-slate-400 font-normal">({city.state})</span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">{city.fleet}</div>
                  </div>
                  {activeCity === city.id && <Check className="w-4 h-4 text-blue-600" />}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="h-5 w-px bg-slate-200 hidden sm:block" />

        {/* Branding */}
        <div className="flex items-center space-x-2">
          <span className="font-black text-slate-900 tracking-tight text-sm sm:text-base font-sans">
            AI Urban Intelligence <span className="text-blue-600">Platform</span>
          </span>
        </div>
      </div>

      {/* 2. CENTER: SEGMENTED VIEW CONTROLLER (Command Deck / Bus Simulation / Analytics) */}
      <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-2xs">
        <button
          onClick={() => onSelectTab('command')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
            activeTab === 'command'
              ? 'bg-white text-blue-700 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Compass className="w-3.5 h-3.5 text-blue-600" />
          <span>Command Deck</span>
        </button>

        <button
          onClick={() => onSelectTab('simulation')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
            activeTab === 'simulation'
              ? 'bg-white text-blue-700 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Video className="w-3.5 h-3.5 text-blue-600" />
          <span>Bus Simulation</span>
        </button>

        <button
          onClick={() => onSelectTab('analytics')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
            activeTab === 'analytics'
              ? 'bg-white text-blue-700 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5 text-blue-600" />
          <span className="hidden sm:inline">Analytics</span>
        </button>
      </div>

      {/* 3. RIGHT: UTILITY ACTIONS & EDGE STATUS */}
      <div className="flex items-center space-x-1.5 sm:space-x-2">
        {/* Watchlist */}
        <button
          onClick={onOpenWatchlist}
          className="p-2 sm:px-2.5 sm:py-1.5 rounded-lg text-xs font-medium bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200 transition-all flex items-center space-x-1 cursor-pointer"
          title="Maintain Vehicle Watchlist"
        >
          <Search className="w-3.5 h-3.5 text-slate-500" />
          <span className="hidden sm:inline">Watchlist</span>
        </button>

        {/* Signboards */}
        <button
          onClick={onOpenSignboards}
          className="p-2 sm:px-2.5 sm:py-1.5 rounded-lg text-xs font-medium bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200 transition-all flex items-center space-x-1 cursor-pointer"
          title="Historical Signboard Inventory"
        >
          <ClipboardList className="w-3.5 h-3.5 text-slate-500" />
          <span className="hidden sm:inline">Signboards</span>
        </button>

        {/* Ingest Frame */}
        <button
          onClick={onOpenUpload}
          className="p-2 sm:px-2.5 sm:py-1.5 rounded-lg text-xs font-medium bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200 transition-all flex items-center space-x-1 cursor-pointer"
          title="Upload External Frame / Video"
        >
          <Upload className="w-3.5 h-3.5 text-slate-500" />
          <span className="hidden sm:inline">Upload</span>
        </button>

        {/* Reset Demo */}
        <button
          onClick={onReset}
          className="p-2 sm:px-2 sm:py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-all cursor-pointer"
          title="Reset Simulation & Data to Initial State"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        <div className="h-5 w-px bg-slate-200 hidden md:block" />

        {/* System Pulse Indicator */}
        <div className="hidden md:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-mono font-bold">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Edge Online</span>
        </div>
      </div>
    </header>
  );
}
