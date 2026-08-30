import React from 'react';
import { Activity, ShieldAlert, Car, Bus, CheckCircle2, ChevronRight } from 'lucide-react';

export default function ActivityTicker({ logs = [], onSelectAlertCode }) {
  return (
    <div className="bg-white border-t border-slate-200 px-4 py-2.5 flex items-center justify-between shadow-xs">
      
      {/* Label Badge */}
      <div className="flex items-center space-x-2 pr-4 border-r border-slate-200 shrink-0">
        <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
        <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider font-mono">
          LIVE AI ACTIVITY
        </span>
      </div>

      {/* Scrolling / Sliding Activity Stream */}
      <div className="flex-1 overflow-x-auto no-scrollbar flex items-center space-x-6 px-4">
        {logs.slice(0, 5).map((log) => {
          const isCritical = log.severity === 'CRITICAL';
          const isWarning = log.severity === 'WARNING';
          const isSuccess = log.severity === 'SUCCESS';

          return (
            <div
              key={`act-${log.id}`}
              className="flex items-center space-x-2 text-xs whitespace-nowrap text-slate-700 hover:text-slate-950 transition-colors cursor-pointer group shrink-0"
            >
              <span className={`w-1.5 h-1.5 rounded-full ${
                isCritical ? 'bg-red-500' : isWarning ? 'bg-amber-500' : isSuccess ? 'bg-emerald-500' : 'bg-blue-500'
              }`}></span>

              <span className="font-semibold text-slate-900 font-mono text-[11px]">
                [{log.agent_name || 'AI'}]
              </span>

              <span className="text-slate-600 group-hover:text-slate-900">
                {log.message}
              </span>

              <span className="text-[10px] text-slate-400 font-mono">
                {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>
          );
        })}

        {logs.length === 0 && (
          <span className="text-xs text-slate-400 font-medium">
            AI sensing stream active. Waiting for transit telemetry packets...
          </span>
        )}
      </div>

      {/* Stream health indicator */}
      <div className="hidden sm:flex items-center space-x-1.5 pl-4 border-l border-slate-200 text-[11px] text-slate-500 font-mono shrink-0">
        <span>Websocket:</span>
        <span className="text-emerald-600 font-bold">CONNECTED</span>
      </div>

    </div>
  );
}
