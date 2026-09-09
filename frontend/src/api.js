import axios from 'axios';
import { FALLBACK_HYDERABAD, FALLBACK_PUNE, FALLBACK_SYS_INFO } from './fallbackData';

const API_BASE = '/api';

const getFallbackDataForCity = (city = 'hyderabad') => {
  return city?.toLowerCase() === 'pune' ? FALLBACK_PUNE : FALLBACK_HYDERABAD;
};

export const api = {
  // Unified High-Performance Dashboard Aggregate (City-Isolated)
  getDashboardData: async (limit = 50, city = 'hyderabad') => {
    try {
      const res = await axios.get(`${API_BASE}/stats/dashboard?limit_alerts=${limit}&city=${city}`);
      return res.data;
    } catch (e) {
      console.warn('API backend not reachable, using embedded fallback data for Vercel preview.');
      return getFallbackDataForCity(city);
    }
  },

  // Live Hardware / System Telemetry
  getSystemInfo: async () => {
    try {
      const res = await axios.get(`${API_BASE}/stats/system-info`);
      return res.data;
    } catch (e) {
      return FALLBACK_SYS_INFO;
    }
  },

  // Stats & Analytics
  getStats: async (city = 'hyderabad') => {
    try {
      const res = await axios.get(`${API_BASE}/stats?city=${city}`);
      return res.data;
    } catch (e) {
      return getFallbackDataForCity(city).stats;
    }
  },

  // Alerts
  getAlerts: async (params = {}) => {
    try {
      const res = await axios.get(`${API_BASE}/alerts`, { params });
      return res.data;
    } catch (e) {
      const city = params.city || 'hyderabad';
      return getFallbackDataForCity(city).alerts;
    }
  },

  getAlertDetail: async (id) => {
    try {
      const res = await axios.get(`${API_BASE}/alerts/${id}`);
      return res.data;
    } catch (e) {
      const allAlerts = [...FALLBACK_HYDERABAD.alerts, ...FALLBACK_PUNE.alerts];
      return allAlerts.find((a) => a.id === id) || allAlerts[0];
    }
  },

  updateAlertAction: async (id, action) => {
    try {
      const res = await axios.patch(`${API_BASE}/alerts/${id}/action?action=${action}`);
      return res.data;
    } catch (e) {
      return { status: 'success', id, action };
    }
  },

  // Fleet & Activity
  getFleet: async (city = null) => {
    try {
      const url = city ? `${API_BASE}/fleet/buses?city=${city}` : `${API_BASE}/fleet/buses`;
      const res = await axios.get(url);
      return res.data;
    } catch (e) {
      return getFallbackDataForCity(city || 'hyderabad').fleet;
    }
  },

  getActivityLogs: async (city = null) => {
    try {
      const url = city ? `${API_BASE}/fleet/activity?city=${city}` : `${API_BASE}/fleet/activity`;
      const res = await axios.get(url);
      return res.data;
    } catch (e) {
      return getFallbackDataForCity(city || 'hyderabad').activity_logs;
    }
  },

  // Simulation Controls
  getSimStatus: async () => {
    try {
      const res = await axios.get(`${API_BASE}/simulate/status`);
      return res.data;
    } catch (e) {
      return FALLBACK_HYDERABAD.sim_status;
    }
  },

  setSimCity: async (city) => {
    try {
      const res = await axios.post(`${API_BASE}/simulate/set-city?city=${city}`);
      return res.data;
    } catch (e) {
      return { status: 'success', city };
    }
  },

  setSimBus: async (busId) => {
    try {
      const res = await axios.post(`${API_BASE}/simulate/set-bus?bus_id=${busId}`);
      return res.data;
    } catch (e) {
      return { status: 'success', bus_id: busId };
    }
  },

  setSimCamera: async (cameraId) => {
    try {
      const res = await axios.post(`${API_BASE}/simulate/set-camera?camera_id=${cameraId}`);
      return res.data;
    } catch (e) {
      return { status: 'success', camera_id: cameraId };
    }
  },

  stepSim: async (progress = null, lat = null, lng = null) => {
    try {
      let url = `${API_BASE}/simulate/step`;
      const params = [];
      if (progress !== null) params.push(`progress=${progress.toFixed(5)}`);
      if (lat !== null) params.push(`lat=${lat}`);
      if (lng !== null) params.push(`lng=${lng}`);
      if (params.length) url += `?${params.join('&')}`;
      const res = await axios.post(url);
      return res.data;
    } catch (e) {
      return { status: 'success', step: 1 };
    }
  },

  toggleSimPlay: async (play) => {
    try {
      const res = await axios.post(`${API_BASE}/simulate/toggle-play?play=${play}`);
      return res.data;
    } catch (e) {
      return { status: 'success', playing: play };
    }
  },

  resetSim: async (cleanSlate = true) => {
    try {
      const res = await axios.post(`${API_BASE}/simulate/reset?clean_slate=${cleanSlate}`);
      return res.data;
    } catch (e) {
      return { status: 'success' };
    }
  },

  // Send Live Frame directly from Video Element
  sendLiveFrame: async (payload) => {
    try {
      const res = await axios.post(`${API_BASE}/simulate/live-frame`, payload);
      return res.data;
    } catch (e) {
      return { status: 'offline_preview' };
    }
  },

  // Ingest Custom Image
  ingestImage: async (formData) => {
    try {
      const res = await axios.post(`${API_BASE}/ingest`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return res.data;
    } catch (e) {
      return { status: 'offline_preview' };
    }
  },

  // Watchlist & Infrastructure
  getWatchlist: async () => {
    try {
      const res = await axios.get(`${API_BASE}/infrastructure/watchlist`);
      return res.data;
    } catch (e) {
      return [];
    }
  },

  addWatchlistEntry: async (entry) => {
    try {
      const res = await axios.post(`${API_BASE}/infrastructure/watchlist`, entry);
      return res.data;
    } catch (e) {
      return { status: 'success', entry };
    }
  },

  removeWatchlistEntry: async (plate) => {
    try {
      const res = await axios.delete(`${API_BASE}/infrastructure/watchlist/${plate}`);
      return res.data;
    } catch (e) {
      return { status: 'success', plate };
    }
  },

  getSignboards: async (city = 'hyderabad') => {
    try {
      const res = await axios.get(`${API_BASE}/infrastructure/signboards?city=${city}`);
      return res.data;
    } catch (e) {
      return [];
    }
  }
};
