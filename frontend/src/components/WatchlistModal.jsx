import React, { useState, useEffect } from 'react';
import { ShieldAlert, Plus, Trash2, Search, Car, AlertTriangle, X, Check, Clock } from 'lucide-react';
import { api } from '../api';

export default function WatchlistModal({ isOpen, onClose }) {
  const [watchlist, setWatchlist] = useState([]);
  const [newPlate, setNewPlate] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newReason, setNewReason] = useState('STOLEN_VEHICLE');
  const [newThreat, setNewThreat] = useState('P0_CRITICAL');
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const loadWatchlist = async () => {
    try {
      const data = await api.getWatchlist();
      if (data) setWatchlist(data);
    } catch (e) {
      console.error('Failed to load watchlist:', e);
    }
  };

  useEffect(() => {
    if (isOpen) loadWatchlist();
  }, [isOpen]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newPlate.trim()) return;
    setLoading(true);
    try {
      await api.addWatchlistEntry({
        plate_number: newPlate,
        formatted_plate: newPlate.toUpperCase(),
        vehicle_description: newDesc || 'Vehicle under observation',
        reason: newReason,
        threat_level: newThreat
      });
      setNewPlate('');
      setNewDesc('');
      await loadWatchlist();
    } catch (e) {
      console.error('Failed to add entry:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (plate) => {
    try {
      await api.removeWatchlistEntry(plate);
      await loadWatchlist();
    } catch (e) {
      console.error('Failed to remove entry:', e);
    }
  };

  if (!isOpen) return null;

  const filtered = watchlist.filter(
    (w) =>
      w.plate_number.toLowerCase().includes(search.toLowerCase()) ||
      (w.vehicle_description && w.vehicle_description.toLowerCase().includes(search.toLowerCase())) ||
      (w.reason && w.reason.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white shadow-xs">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">Central ANPR Watchlist Authority</h3>
              <p className="text-[11px] text-slate-500 font-mono">Synchronized to all bus edge nodes for local plate matching</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-200 text-slate-500">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form to Add New Plate */}
        <form onSubmit={handleAdd} className="p-4 border-b border-slate-200 bg-white grid grid-cols-1 sm:grid-cols-4 gap-2">
          <div>
            <label className="text-[10px] font-mono uppercase font-bold text-slate-500 block mb-1">Plate Number</label>
            <input
              type="text"
              placeholder="e.g. TS09EA4412"
              value={newPlate}
              onChange={(e) => setNewPlate(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs font-mono font-bold uppercase border border-slate-200 rounded-lg focus:outline-none focus:border-red-500"
              required
            />
          </div>
          <div>
            <label className="text-[10px] font-mono uppercase font-bold text-slate-500 block mb-1">Vehicle Details</label>
            <input
              type="text"
              placeholder="e.g. Black Yamaha R15"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-red-500"
            />
          </div>
          <div>
            <label className="text-[10px] font-mono uppercase font-bold text-slate-500 block mb-1">Threat Level</label>
            <select
              value={newThreat}
              onChange={(e) => setNewThreat(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs font-mono font-semibold border border-slate-200 rounded-lg focus:outline-none focus:border-red-500 bg-white"
            >
              <option value="P0_CRITICAL">P0 CRITICAL (Urgent)</option>
              <option value="P1_HIGH">P1 HIGH (Alert)</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-1.5 px-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1 shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Target</span>
            </button>
          </div>
        </form>

        {/* Search */}
        <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search active watchlist..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent text-xs focus:outline-none font-sans"
          />
        </div>

        {/* Watchlist Table */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-2">
            {filtered.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">No watchlisted vehicles found.</div>
            ) : (
              filtered.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <span className="px-2.5 py-1 rounded-md font-mono font-extrabold text-xs bg-slate-100 text-slate-900 border border-slate-300">
                      {item.formatted_plate || item.plate_number}
                    </span>
                    <div>
                      <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <span>{item.vehicle_description}</span>
                        <span
                          className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-extrabold ${
                            item.threat_level === 'P0_CRITICAL'
                              ? 'bg-red-100 text-red-700 border border-red-200'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {item.threat_level}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">{item.reason}</div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {item.match_count || 0} Matches
                    </span>
                    <button
                      onClick={() => handleDelete(item.plate_number)}
                      className="text-slate-400 hover:text-red-600 p-1.5 rounded hover:bg-red-50 transition-colors"
                      title="Deactivate Target"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-200 bg-slate-50 text-[11px] font-mono text-slate-500 flex items-center justify-between">
          <span>Edge-Cached on: Jetson Orin NX (All Fleet)</span>
          <button onClick={onClose} className="px-3 py-1 bg-slate-200 hover:bg-slate-300 rounded-lg text-xs font-bold text-slate-700">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
