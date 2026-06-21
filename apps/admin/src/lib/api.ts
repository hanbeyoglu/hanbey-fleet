import axios from 'axios';
import type { SchedulerStatusDto } from '../types/api';

const BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      const refresh = localStorage.getItem('refreshToken');
      if (refresh) {
        try {
          const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken: refresh });
          localStorage.setItem('accessToken', data.accessToken);
          localStorage.setItem('refreshToken', data.refreshToken);
          error.config.headers.Authorization = `Bearer ${data.accessToken}`;
          return api.request(error.config);
        } catch {
          localStorage.clear();
          window.location.href = '/login';
        }
      } else {
        localStorage.clear();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

export const authApi = {
  login: (username: string, password: string) => api.post('/auth/login', { username, password }),
  me: () => api.get('/auth/me'),
  selectFleet: (fleetOwnerId: string) =>
    api.post<{ accessToken: string; refreshToken: string; fleetOwnerId: string; fleetOwnerName: string }>(
      '/auth/select-fleet',
      { fleetOwnerId },
    ),
  clearFleet: () =>
    api.post<{ accessToken: string; refreshToken: string; fleetOwnerId: null; fleetOwnerName: null }>(
      '/auth/clear-fleet',
    ),
};

export const vehiclesApi = {
  list: (params?: Record<string, unknown>) => api.get('/vehicles', { params }),
  get: (id: string) => api.get(`/vehicles/${id}`),
  create: (data: unknown) => api.post('/vehicles', data),
  update: (id: string, data: unknown) => api.patch(`/vehicles/${id}`, data),
  delete: (id: string) => api.delete(`/vehicles/${id}`),
};

export const driversApi = {
  list: () => api.get('/drivers'),
  get: (id: string) => api.get(`/drivers/${id}`),
  create: (data: unknown) => api.post('/drivers', data),
  update: (id: string, data: unknown) => api.patch(`/drivers/${id}`, data),
  delete: (id: string) => api.delete(`/drivers/${id}`),
};

export const shiftsApi = {
  current: (params?: { vehicleId?: string; driverId?: string }) =>
    api.get('/shifts/current', { params }),
  history: (params?: Record<string, unknown>) => api.get('/shifts/history', { params }),
};

export const timelineApi = {
  list: () => api.get('/timeline'),
  byVehicle: (vehicleId: string, limit?: number) =>
    api.get(`/timeline/vehicle/${vehicleId}`, { params: limit ? { limit } : {} }),
};

export const settlementsApi = {
  list: (params?: Record<string, unknown>) => api.get('/settlements', { params }),
  get: (id: string) => api.get(`/settlements/${id}`),
  create: (data: unknown) => api.post('/settlements/create', data),
  approve: (id: string, data?: unknown) => api.post(`/settlements/${id}/approve`, data ?? {}),
};

export const expensesApi = {
  list: (params?: Record<string, unknown>) => api.get('/expenses', { params }),
  get: (id: string) => api.get(`/expenses/${id}`),
  create: (data: unknown) => api.post('/expenses', data),
  update: (id: string, data: unknown) => api.patch(`/expenses/${id}`, data),
  delete: (id: string) => api.delete(`/expenses/${id}`),
};

export const maintenanceApi = {
  list: (params?: Record<string, unknown>) => api.get('/maintenance', { params }),
  get: (id: string) => api.get(`/maintenance/${id}`),
  create: (data: unknown) => api.post('/maintenance', data),
  update: (id: string, data: unknown) => api.patch(`/maintenance/${id}`, data),
  delete: (id: string) => api.delete(`/maintenance/${id}`),
};

export const hgsApi = {
  list: (params?: Record<string, unknown>) => api.get('/hgs', { params }),
  get: (id: string) => api.get(`/hgs/${id}`),
  sync: (data: unknown) => api.post('/hgs/sync', data),
};

export const reportsApi = {
  monthly: (year: number, month: number) => api.get('/reports/monthly', { params: { year, month } }),
  vehicle: (id: string, year: number, month: number) =>
    api.get(`/reports/vehicle/${id}`, { params: { year, month } }),
};

export const dashboardApi = {
  overview: () => api.get('/dashboard'),
  charts: () => api.get('/dashboard/charts'),
};

export const notificationsApi = {
  list: (params?: Record<string, unknown>) => api.get('/notifications', { params }),
  unreadCount: () => api.get<{ count: number }>('/notifications/unread-count'),
  markRead: (id: string) => api.post(`/notifications/${id}/read`),
  markAllRead: () => api.post('/notifications/read-all'),
};

export const importsApi = {
  list: (params?: Record<string, unknown>) => api.get('/imports', { params }),
  get: (id: string) => api.get(`/imports/${id}`),
  manual: (data: { rawContent: string }) => api.post('/imports/manual', data),
  ocr: (data: { text: string }) => api.post('/imports/ocr', data),
  whatsapp: (data: { message: string; sender?: string; receivedAt?: string }) =>
    api.post('/imports/whatsapp', data),
};

export const schedulerApi = {
  jobs: () => api.get<SchedulerStatusDto>('/scheduler/jobs'),
  run: (job: string) => api.post(`/scheduler/run/${job}`),
};

export const documentsApi = {
  list: (params?: Record<string, unknown>) => api.get('/documents', { params }),
  get: (id: string) => api.get(`/documents/${id}`),
  create: (data: unknown) => api.post('/documents', data),
  update: (id: string, data: unknown) => api.patch(`/documents/${id}`, data),
  newVersion: (id: string, data: unknown) => api.post(`/documents/${id}/new-version`, data),
  delete: (id: string) => api.delete(`/documents/${id}`),
};

export const fleetOwnersApi = {
  list: () => api.get('/fleet-owners'),
  get: (id: string) => api.get(`/fleet-owners/${id}`),
  create: (data: unknown) => api.post('/fleet-owners', data),
  update: (id: string, data: unknown) => api.patch(`/fleet-owners/${id}`, data),
  delete: (id: string) => api.delete(`/fleet-owners/${id}`),
  findOrCreate: (data: { phone: string; name?: string; email?: string; address?: string; taxNumber?: string }) =>
    api.post('/fleet-owners/find-or-create', data),
  members: (id: string) => api.get(`/fleet-owners/${id}/members`),
};

export const vehicleAssignmentsApi = {
  list: (params?: Record<string, unknown>) => api.get('/vehicle-assignments', { params }),
  get: (id: string) => api.get(`/vehicle-assignments/${id}`),
  history: (params?: Record<string, unknown>) => api.get('/vehicle-assignments/history', { params }),
  assign: (data: { vehicleId: string; driverId: string; notes?: string }) =>
    api.post('/vehicle-assignments', data),
  release: (id: string, data?: { reason?: string }) =>
    api.post(`/vehicle-assignments/${id}/release`, data ?? {}),
};
