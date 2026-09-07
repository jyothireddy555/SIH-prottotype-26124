import axios from 'axios';

const API_BASE = '/api';

export const api = {
  // Unified High-Performance Dashboard Aggregate (City-Isolated)
  getDashboardData: async (limit = 50, city = 'hyderabad') => {
    const res = await axios.get(`${API_BASE}/stats/dashboard?limit_alerts=${limit}&city=${city}`);
    return res.data;
  },

  // Live Hardware / System Telemetry
  getSystemInfo: async () => {
    const res = await axios.get(`${API_BASE}/stats/system-info`);
    return res.data;
  },

  // Stats & Analytics
  getStats: async (city = 'hyderabad') => {
    const res = await axios.get(`${API_BASE}/stats?city=${city}`);
    return res.data;
  },

  // Alerts
  getAlerts: async (params = {}) => {
    const res = await axios.get(`${API_BASE}/alerts`, { params });
    return res.data;
  },

  getAlertDetail: async (id) => {
    const res = await axios.get(`${API_BASE}/alerts/${id}`);
    return res.data;
  },

  updateAlertAction: async (id, action) => {
    const res = await axios.patch(`${API_BASE}/alerts/${id}/action?action=${action}`);
    return res.data;
  },

  // Fleet & Activity
  getFleet: async (city = null) => {
    const url = city ? `${API_BASE}/fleet/buses?city=${city}` : `${API_BASE}/fleet/buses`;
    const res = await axios.get(url);
    return res.data;
  },

  getActivityLogs: async (city = null) => {
    const url = city ? `${API_BASE}/fleet/activity?city=${city}` : `${API_BASE}/fleet/activity`;
    const res = await axios.get(url);
    return res.data;
  },

  // Simulation Controls
  getSimStatus: async () => {
    const res = await axios.get(`${API_BASE}/simulate/status`);
    return res.data;
  },

  setSimCity: async (city) => {
    const res = await axios.post(`${API_BASE}/simulate/set-city?city=${city}`);
    return res.data;
  },

  setSimBus: async (busId) => {
    const res = await axios.post(`${API_BASE}/simulate/set-bus?bus_id=${busId}`);
    return res.data;
  },

  setSimCamera: async (cameraId) => {
    const res = await axios.post(`${API_BASE}/simulate/set-camera?camera_id=${cameraId}`);
    return res.data;
  },

  stepSim: async (progress = null, lat = null, lng = null) => {
    let url = `${API_BASE}/simulate/step`;
    const params = [];
    if (progress !== null) params.push(`progress=${progress.toFixed(5)}`);
    if (lat !== null) params.push(`lat=${lat}`);
    if (lng !== null) params.push(`lng=${lng}`);
    if (params.length) url += `?${params.join('&')}`;
    const res = await axios.post(url);
    return res.data;
  },

  toggleSimPlay: async (play) => {
    const res = await axios.post(`${API_BASE}/simulate/toggle-play?play=${play}`);
    return res.data;
  },

  resetSim: async (cleanSlate = true) => {
    const res = await axios.post(`${API_BASE}/simulate/reset?clean_slate=${cleanSlate}`);
    return res.data;
  },

  // Send Live Frame directly from Video Element
  sendLiveFrame: async (payload) => {
    const res = await axios.post(`${API_BASE}/simulate/live-frame`, payload);
    return res.data;
  },

  // Ingest Custom Image
  ingestImage: async (formData) => {
    const res = await axios.post(`${API_BASE}/ingest`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },

  // Watchlist & Infrastructure
  getWatchlist: async () => {
    const res = await axios.get(`${API_BASE}/infrastructure/watchlist`);
    return res.data;
  },

  addWatchlistEntry: async (entry) => {
    const res = await axios.post(`${API_BASE}/infrastructure/watchlist`, entry);
    return res.data;
  },

  removeWatchlistEntry: async (plate) => {
    const res = await axios.delete(`${API_BASE}/infrastructure/watchlist/${plate}`);
    return res.data;
  },

  getSignboards: async (city = 'hyderabad') => {
    const res = await axios.get(`${API_BASE}/infrastructure/signboards?city=${city}`);
    return res.data;
  }
};
