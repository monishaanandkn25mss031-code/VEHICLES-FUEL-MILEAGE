import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Helper for extracting clean error messages from FastAPI responses
export const getErrorMessage = (error) => {
  if (error.response?.data?.detail) {
    const detail = error.response.data.detail;
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail)) {
      return detail.map((d) => d.msg || JSON.stringify(d)).join(', ');
    }
    return JSON.stringify(detail);
  }
  return error.message || 'An unexpected error occurred. Please try again.';
};

export const vehicleService = {
  getAll: () => api.get('/vehicles').then((r) => r.data),
  getById: (id) => api.get(`/vehicles/${id}`).then((r) => r.data),
  create: (data) => api.post('/vehicles', data).then((r) => r.data),
  update: (id, data) => api.put(`/vehicles/${id}`, data).then((r) => r.data),
  delete: (id) => api.delete(`/vehicles/${id}`).then((r) => r.data),
};

export const fuelService = {
  getAll: (vehicleId) => api.get('/fuel-logs', { params: { vehicle_id: vehicleId || undefined } }).then((r) => r.data),
  getById: (id) => api.get(`/fuel-logs/${id}`).then((r) => r.data),
  create: (data) => api.post('/fuel-logs', data).then((r) => r.data),
  update: (id, data) => api.put(`/fuel-logs/${id}`, data).then((r) => r.data),
  delete: (id) => api.delete(`/fuel-logs/${id}`).then((r) => r.data),
};

export const serviceRecordService = {
  getAll: (vehicleId) => api.get('/service-records', { params: { vehicle_id: vehicleId || undefined } }).then((r) => r.data),
  getById: (id) => api.get(`/service-records/${id}`).then((r) => r.data),
  create: (data) => api.post('/service-records', data).then((r) => r.data),
  update: (id, data) => api.put(`/service-records/${id}`, data).then((r) => r.data),
  delete: (id) => api.delete(`/service-records/${id}`).then((r) => r.data),
  getReminders: () => api.get('/service-records/reminders').then((r) => r.data),
};

export const mileageService = {
  getAll: () => api.get('/mileage').then((r) => r.data),
  getByVehicle: (vehicleId) => api.get(`/mileage/${vehicleId}`).then((r) => r.data),
  simulate: (data) => api.post('/mileage/simulate', data).then((r) => r.data),
};

export const dashboardService = {
  getStats: () => api.get('/dashboard/stats').then((r) => r.data),
};

export const reportsService = {
  getAnalytics: () => api.get('/reports/analytics').then((r) => r.data),
};

export const settingsService = {
  get: () => api.get('/settings').then((r) => r.data),
  update: (data) => api.put('/settings', data).then((r) => r.data),
  getStatus: () => api.get('/settings/status').then((r) => r.data),
};

export default api;
