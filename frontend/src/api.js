import axios from 'axios';

const API_BASE = '/api';

export const api = {
  // Stats & Analytics
  getStats: async () => {
    const res = await axios.get(`${API_BASE}/stats`);
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
  getFleet: async () => {
    const res = await axios.get(`${API_BASE}/fleet/buses`);
    return res.data;
  },

  getActivityLogs: async () => {
    const res = await axios.get(`${API_BASE}/fleet/activity`);
    return res.data;
  },

  // Simulation Controls
  getSimStatus: async () => {
    const res = await axios.get(`${API_BASE}/simulate/status`);
    return res.data;
  },

  setSimBus: async (busId) => {
    const res = await axios.post(`${API_BASE}/simulate/set-bus?bus_id=${busId}`);
    return res.data;
  },

  stepSim: async () => {
    const res = await axios.post(`${API_BASE}/simulate/step`);
    return res.data;
  },

  toggleSimPlay: async (play) => {
    const res = await axios.post(`${API_BASE}/simulate/toggle-play?play=${play}`);
    return res.data;
  },

  resetSim: async () => {
    const res = await axios.post(`${API_BASE}/simulate/reset`);
    return res.data;
  },

  // Ingest Custom Image
  ingestImage: async (formData) => {
    const res = await axios.post(`${API_BASE}/ingest`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  }
};
