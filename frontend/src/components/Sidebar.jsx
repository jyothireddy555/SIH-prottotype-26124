import React, { useState, useEffect } from 'react';
import {
  Layers,
  Disc,
  Droplets,
  Car,
  Users,
  ShieldAlert,
  Flame,
  Bus,
  CheckCircle2,
  ChevronDown,
  Wrench,
  Trash2,
  Footprints,
  ChevronRight
} from 'lucide-react';

export default function Sidebar({
  activeCity = 'hyderabad',
  selectedCategory = 'all',
  onSelectCategory = () => {},
  alerts = [],
  buses = [],
  activeBus = null,
  onSelectBus = () => {}
}) {
  // Helper to count alerts by type
  const countByType = (types) => {
    if (!Array.isArray(types)) types = [types];
    return alerts.filter((a) => types.includes(a.alert_type)).length;
  };

  // Group counts
  const roadSubCounts = {
    all: alerts.filter((a) =>
      ['pothole', 'water_logging', 'road_crack', 'road_damage', 'garbage', 'missing_divider', 'zebra_fading'].includes(a.alert_type)
    ).length,
    pothole: countByType('pothole'),
    water_logging: countByType('water_logging'),
    missing_divider: countByType('missing_divider'),
    damaged_road: countByType(['road_crack', 'road_damage']),
    garbage: countByType('garbage'),
    zebra_fading: countByType('zebra_fading')
  };

  const trafficSubCounts = {
    all: alerts.filter((a) => ['vehicle_density', 'congestion'].includes(a.alert_type)).length,
    congestion: countByType('congestion'),
    vehicle_density: countByType('vehicle_density')
  };

  const safetySubCounts = {
    all: alerts.filter((a) =>
      ['overloaded_two_wheeler', 'helmet_violation', 'rash_driving', 'accident', 'watchlist_match'].includes(a.alert_type)
    ).length,
    overloaded_two_wheeler: countByType('overloaded_two_wheeler'),
    helmet_violation: countByType('helmet_violation'),
    accident: countByType(['accident', 'rash_driving']),
    watchlist_match: countByType('watchlist_match')
  };

  // Channels definitions with sub-types
  const channels = [
    {
      id: 'road',
      label: 'Road Defects',
      icon: Disc,
      iconColor: 'text-red-500',
      count: roadSubCounts.all,
      badgeColor: 'bg-red-50 text-red-700 border-red-200',
      subTypes: [
        { id: 'road', label: 'All Road Defects', count: roadSubCounts.all },
        { id: 'pothole', label: 'Potholes & Cavities', icon: Disc, count: roadSubCounts.pothole },
        { id: 'water_logging', label: 'Water Logging & Puddles', icon: Droplets, count: roadSubCounts.water_logging },
        { id: 'missing_divider', label: 'Divider Missing', icon: Layers, count: roadSubCounts.missing_divider },
        { id: 'damaged_road', label: 'Damaged Road & Cracks', icon: Wrench, count: roadSubCounts.damaged_road },
        { id: 'garbage', label: 'Roadside Garbage / Waste', icon: Trash2, count: roadSubCounts.garbage },
        { id: 'zebra_fading', label: 'Zebra Crossing Fading', icon: Footprints, count: roadSubCounts.zebra_fading }
      ]
    },
    {
      id: 'traffic',
      label: 'Traffic Flow',
      icon: Car,
      iconColor: 'text-amber-500',
      count: trafficSubCounts.all,
      badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
      subTypes: [
        { id: 'traffic', label: 'All Traffic Flow', count: trafficSubCounts.all },
        { id: 'congestion', label: 'Congestion & Choke Points', icon: Car, count: trafficSubCounts.congestion },
        { id: 'vehicle_density', label: 'Vehicle Density Spikes', icon: Users, count: trafficSubCounts.vehicle_density }
      ]
    },
    {
      id: 'safety',
      label: 'Safety & ANPR',
      icon: ShieldAlert,
      iconColor: 'text-purple-600',
      count: safetySubCounts.all,
      badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
      subTypes: [
        { id: 'safety', label: 'All Safety & ANPR', count: safetySubCounts.all },
        { id: 'overloaded_two_wheeler', label: 'Overloaded 2W (>2 Pax)', icon: Users, count: safetySubCounts.overloaded_two_wheeler },
        { id: 'helmet_violation', label: 'Helmet Violations', icon: ShieldAlert, count: safetySubCounts.helmet_violation },
        { id: 'accident', label: 'Accident & Rash Driving', icon: Flame, count: safetySubCounts.accident },
        { id: 'watchlist_match', label: 'Watchlist Matches (P0)', icon: ShieldAlert, count: safetySubCounts.watchlist_match }
      ]
    }
  ];

  // Accordion state
  const [expandedChannels, setExpandedChannels] = useState({
    road: false,
    traffic: false,
    safety: false
  });

  // Auto-expand channel if selectedCategory belongs to it
  useEffect(() => {
    channels.forEach((ch) => {
      if (ch.subTypes.some((st) => st.id === selectedCategory)) {
        setExpandedChannels((prev) => ({ ...prev, [ch.id]: true }));
      }
    });
  }, [selectedCategory]);

  const toggleChannel = (channelId) => {
    setExpandedChannels((prev) => {
      const isCurrentlyOpen = prev[channelId];
      // If opening, also select the channel group
      if (!isCurrentlyOpen) {
        onSelectCategory(channelId);
      }
      return { ...prev, [channelId]: !isCurrentlyOpen };
    });
  };

  const cityBuses =
    activeCity === 'hyderabad'
      ? [
          { id: 'HYD-101', route: 'Route 216', name: 'Gachibowli - Hitec City Corridor', speed: 36 },
          { id: 'HYD-204', route: 'Route 10H', name: 'Mehdipatnam - Secunderabad Corridor', speed: 28 },
          { id: 'HYD-305', route: 'Route 5K', name: 'Charminar - Koti Corridor', speed: 25 }
        ]
      : [
          { id: 'BUS-104', route: 'Route 115', name: 'Sus Road - Pashan Corridor', speed: 34 },
          { id: 'BUS-218', route: 'Route 500D', name: 'Nagar Rd - Yerawada Corridor', speed: 26 },
          { id: 'BUS-301', route: 'Route 335E', name: 'Katraj - Swargate Highway Corridor', speed: 29 }
        ];

  return (
    <aside className="w-72 md:w-80 bg-white border-r border-slate-200 flex flex-col shrink-0 h-full overflow-hidden">
      {/* 1. TOP: INCIDENT CHANNELS */}
      <div className="p-4 border-b border-slate-100 flex-1 overflow-y-auto space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2.5 px-1">
            <h3 className="text-xs font-mono uppercase font-bold text-slate-400 tracking-wider">
              Incident Channels
            </h3>
            <span className="text-[10px] text-slate-400 font-sans">Click to expand</span>
          </div>

          <div className="space-y-1.5">
            {/* Channel: All Incidents */}
            <button
              onClick={() => onSelectCategory('all')}
              className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200/80'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Layers className={`w-4 h-4 ${selectedCategory === 'all' ? 'text-white' : 'text-blue-600'}`} />
                <span>All Incidents</span>
              </div>
              <span
                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                  selectedCategory === 'all' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {alerts.length}
              </span>
            </button>

            {/* Expandable Channels */}
            {channels.map((channel) => {
              const Icon = channel.icon;
              const isExpanded = expandedChannels[channel.id];
              const isChannelActive =
                selectedCategory === channel.id ||
                channel.subTypes.some((st) => st.id === selectedCategory);

              return (
                <div key={channel.id} className="space-y-1">
                  {/* Channel Header Button */}
                  <button
                    onClick={() => toggleChannel(channel.id)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      selectedCategory === channel.id
                        ? 'bg-blue-600 text-white shadow-xs'
                        : isChannelActive
                        ? 'bg-blue-50 text-blue-900 border border-blue-200 font-bold'
                        : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200/80'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <Icon
                        className={`w-4 h-4 ${
                          selectedCategory === channel.id ? 'text-white' : channel.iconColor
                        }`}
                      />
                      <span>{channel.label}</span>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                          selectedCategory === channel.id
                            ? 'bg-white/20 text-white border-white/20'
                            : channel.badgeColor
                        }`}
                      >
                        {channel.count}
                      </span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 transition-transform duration-200 ${
                          isExpanded ? 'rotate-180' : ''
                        } ${selectedCategory === channel.id ? 'text-white' : 'text-slate-400'}`}
                      />
                    </div>
                  </button>

                  {/* Sub-Types Drawer (Shown when channel is expanded) */}
                  {isExpanded && (
                    <div className="pl-3 pr-1 py-1.5 space-y-1 bg-slate-50/70 rounded-xl border border-slate-200/80 animate-in fade-in slide-in-from-top-1 duration-150">
                      <div className="text-[10px] font-mono uppercase font-bold text-slate-400 px-2 py-0.5">
                        Filter by {channel.label} Sub-Type:
                      </div>

                      {channel.subTypes.map((subType) => {
                        const SubIcon = subType.icon || channel.icon;
                        const isSubActive = selectedCategory === subType.id;

                        return (
                          <button
                            key={subType.id}
                            onClick={() => onSelectCategory(subType.id)}
                            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                              isSubActive
                                ? 'bg-blue-600 text-white font-bold shadow-2xs'
                                : 'text-slate-600 hover:bg-white hover:text-slate-900 border border-transparent hover:border-slate-200'
                            }`}
                          >
                            <div className="flex items-center space-x-2 truncate">
                              <SubIcon
                                className={`w-3.5 h-3.5 shrink-0 ${
                                  isSubActive ? 'text-white' : 'text-slate-400'
                                }`}
                              />
                              <span className="truncate">{subType.label}</span>
                            </div>

                            <span
                              className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full shrink-0 ml-1.5 ${
                                isSubActive
                                  ? 'bg-white/20 text-white'
                                  : subType.count > 0
                                  ? 'bg-white text-slate-700 border border-slate-200'
                                  : 'text-slate-400'
                              }`}
                            >
                              {subType.count}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. ACTIVE FLEET STATUS */}
        <div className="pt-2">
          <div className="flex items-center justify-between px-1 mb-2.5">
            <h3 className="text-xs font-mono uppercase font-bold text-slate-400 tracking-wider">
              Active Fleet Status
            </h3>
            <span className="text-[10px] font-mono text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
              3 Roving
            </span>
          </div>

          <div className="space-y-2">
            {cityBuses.map((bus) => {
              const isSelected = (activeBus?.bus_label || 'HYD-101') === bus.id;
              return (
                <div
                  key={bus.id}
                  onClick={() => onSelectBus(bus.id)}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50/70 border-blue-300 shadow-2xs'
                      : 'bg-slate-50/70 border-slate-200/90 hover:bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-2">
                      <div
                        className={`p-1.5 rounded-lg ${
                          isSelected ? 'bg-blue-600 text-white' : 'bg-white text-slate-700 border border-slate-200'
                        }`}
                      >
                        <Bus className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-bold font-mono text-slate-900">{bus.id}</span>
                    </div>
                    <span className="text-[10px] font-mono font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                      {bus.speed} km/h
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pl-8">
                    <span className="truncate">{bus.name}</span>
                    <span className="font-mono text-[10px] text-slate-400 shrink-0">{bus.route}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. FOOTER TELEMETRY STATUS */}
      <div className="p-3 border-t border-slate-200 bg-slate-50 text-[11px] font-mono text-slate-500 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>Local SQLite Sync: OK</span>
        </div>
        <span className="text-slate-400 font-bold">{activeCity.toUpperCase()}</span>
      </div>
    </aside>
  );
}
