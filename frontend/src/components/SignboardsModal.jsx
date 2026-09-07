import React, { useState, useEffect } from 'react';
import { ClipboardList, MapPin, Search, AlertTriangle, CheckCircle2, X, Clock } from 'lucide-react';
import { api } from '../api';

export default function SignboardsModal({ isOpen, onClose, activeCity = 'hyderabad' }) {
  const [signboards, setSignboards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const loadSignboards = async () => {
    try {
      setLoading(true);
      const data = await api.getSignboards(activeCity);
      if (data) setSignboards(data);
    } catch (e) {
      console.error('Failed to load signboards:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) loadSignboards();
  }, [isOpen, activeCity]);

  if (!isOpen) return null;

  const filtered = signboards.filter(
    (s) =>
      s.signboard_code.toLowerCase().includes(search.toLowerCase()) ||
      (s.location_name && s.location_name.toLowerCase().includes(search.toLowerCase())) ||
      (s.sign_type && s.sign_type.toLowerCase().includes(search.toLowerCase())) ||
      (s.ocr_text && s.ocr_text.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
              <ClipboardList className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Historical Signboard Inventory · {activeCity.toUpperCase()}
              </h3>
              <p className="text-[11px] text-slate-500 font-mono">
                Server Baseline Tracking: Repeated missed observations flag missing infrastructure
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-200 text-slate-500">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-4 py-2 bg-white border-b border-slate-200 flex items-center gap-2">
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search signboards by code, type, road..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent text-xs focus:outline-none font-sans"
          />
        </div>

        {/* Table / List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">No signboard records found for this corridor.</div>
          ) : (
            filtered.map((sign) => {
              const isMissing = sign.status === 'POSSIBLY_MISSING' || sign.status === 'MISSING';
              return (
                <div
                  key={sign.id || sign.signboard_code}
                  className={`p-3 rounded-xl border transition-colors ${
                    isMissing
                      ? 'bg-amber-50/70 border-amber-300'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-xs text-slate-900">{sign.signboard_code}</span>
                        <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 font-semibold">
                          {sign.sign_type}
                        </span>
                        {isMissing ? (
                          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded font-extrabold bg-amber-200 text-amber-900 border border-amber-300 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-amber-700" />
                            POSSIBLY MISSING ({sign.missed_observations} Missed Trips)
                          </span>
                        ) : (
                          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            CONFIRMED PRESENT
                          </span>
                        )}
                      </div>

                      <div className="text-xs font-semibold text-slate-800 mt-1 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{sign.location_name}</span>
                        <span className="text-slate-400 font-mono text-[10px]">
                          ({sign.latitude.toFixed(4)}°, {sign.longitude.toFixed(4)}°)
                        </span>
                      </div>

                      {sign.ocr_text && (
                        <div className="text-[11px] font-mono text-slate-600 bg-white p-1.5 rounded border border-slate-200 mt-2">
                          <span className="text-slate-400 text-[10px]">OCR Text: </span>
                          <span className="font-bold">{sign.ocr_text}</span>
                        </div>
                      )}
                    </div>

                    <div className="text-right text-[10px] font-mono text-slate-400">
                      <div>First Seen: 30d ago</div>
                      <div className="text-slate-600 font-semibold mt-0.5">
                        Last seen: {new Date(sign.last_confirmed_present).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-200 bg-slate-50 text-[11px] font-mono text-slate-500 flex items-center justify-between">
          <span>Authority: Central Server Baseline Engine</span>
          <button onClick={onClose} className="px-3 py-1 bg-slate-200 hover:bg-slate-300 rounded-lg text-xs font-bold text-slate-700">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
