import axios from 'axios';

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
  login: (email: string, password: string) => api.post('/auth/login', { email, password }),
  me: () => api.get('/auth/me'),
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

export const settlementsApi = {
  list: (params?: { vehicleId?: string; driverId?: string }) =>
    api.get('/settlements', { params }),
  get: (id: string) => api.get(`/settlements/${id}`),
  create: (data: unknown) => api.post('/settlements', data),
  update: (id: string, data: unknown) => api.patch(`/settlements/${id}`, data),
};

export const expensesApi = {
  list: (vehicleId?: string) => api.get('/expenses', { params: vehicleId ? { vehicleId } : {} }),
  get: (id: string) => api.get(`/expenses/${id}`),
  create: (data: unknown) => api.post('/expenses', data),
  update: (id: string, data: unknown) => api.patch(`/expenses/${id}`, data),
  delete: (id: string) => api.delete(`/expenses/${id}`),
};

export const maintenanceApi = {
  list: (vehicleId?: string) =>
    api.get('/maintenance', { params: vehicleId ? { vehicleId } : {} }),
  get: (id: string) => api.get(`/maintenance/${id}`),
  create: (data: unknown) => api.post('/maintenance', data),
  update: (id: string, data: unknown) => api.patch(`/maintenance/${id}`, data),
  delete: (id: string) => api.delete(`/maintenance/${id}`),
};

export const reportsApi = {
  monthly: (year: number, month: number) => api.get('/reports/monthly', { params: { year, month } }),
  vehicle: (id: string, year: number, month: number) =>
    api.get(`/reports/vehicle/${id}`, { params: { year, month } }),
};

export const notificationsApi = {
  list: (unreadOnly?: boolean) =>
    api.get('/notifications', { params: unreadOnly ? { unreadOnly: true } : {} }),
  markRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
};
