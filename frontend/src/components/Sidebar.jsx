import React from 'react';
import { 
  LayoutDashboard, Bus, AlertTriangle, Disc, 
  Car, BarChart3, Bot, Settings, Layers, Video
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, stats }) {
  const navItems = [
    { 
      id: 'command', 
      label: 'Command Center', 
      icon: LayoutDashboard,
      badge: null 
    },
    { 
      id: 'fleet', 
      label: 'Fleet Tracking', 
      icon: Bus,
      badge: `${stats?.active_buses || 3} Active` 
    },
    { 
      id: 'potholes', 
      label: 'Road Defects', 
      icon: Disc,
      badge: stats?.total_potholes || 0,
      badgeColor: 'bg-red-100 text-red-700'
    },
    { 
      id: 'traffic', 
      label: 'Traffic Density', 
      icon: Car,
      badge: stats?.total_traffic_alerts || 0,
      badgeColor: 'bg-amber-100 text-amber-700'
    },
    { 
      id: 'analytics', 
      label: 'Urban Analytics', 
      icon: BarChart3,
      badge: null 
    },
    { 
      id: 'agents', 
      label: 'AI Agent Network', 
      icon: Bot,
      badge: '4 Online',
      badgeColor: 'bg-blue-100 text-blue-700'
    }
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 h-[calc(100vh-61px)] sticky top-[61px]">
      <div className="p-4 space-y-6">
        
        {/* Navigation Menu */}
        <div>
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2 font-mono">
            OPERATIONS
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    isActive 
                      ? 'bg-blue-50 text-blue-700 font-semibold shadow-2xs' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== null && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-medium ${
                      item.badgeColor || 'bg-slate-100 text-slate-600'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Quick Fleet Health Card */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider font-mono">
              ROAD QUALITY SCORE
            </span>
            <span className="text-xs font-bold text-blue-700 font-mono">
              {stats?.road_health_index || 88.5}/100
            </span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
            <div 
              className="bg-blue-600 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${stats?.road_health_index || 88.5}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>Critical Defects: <b className="text-red-600">{stats?.critical_severity_count || 0}</b></span>
            <span>Open: <b className="text-amber-600">{stats?.open_incidents || 0}</b></span>
          </div>
        </div>

      </div>

      {/* Footer Edge AI Spec */}
      <div className="p-4 border-t border-slate-200 bg-slate-50/50">
        <div className="flex items-center space-x-2 text-[11px] text-slate-500">
          <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
          <span>Edge Pipeline: <b>YOLOv8 + RDD</b></span>
        </div>
        <div className="text-[10px] text-slate-400 mt-1 font-mono">
          CUDA RTX 3050 · 4.2ms/frame
        </div>
      </div>

    </aside>
  );
}
