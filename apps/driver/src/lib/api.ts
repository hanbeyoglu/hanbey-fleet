import axios from 'axios';
import type {
  DriverPortalOverviewDto,
  DriverPortalProfileDto,
  DriverPortalAssignmentDto,
  ShiftResponseDto,
  EndOfDayInput,
  EndOfDayResultDto,
  DocumentResponseDto,
  NotificationResponseDto,
} from '../types/api';
import { PaginatedResponse } from '@hanbey-fleet/shared';

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
  login: (username: string, password: string) =>
    api.post<{
      accessToken: string;
      refreshToken: string;
      user: DriverPortalProfileDto['user'] & { name: string };
      fleetMemberships?: Array<{
        membershipId: string;
        fleetOwnerId: string;
        fleetOwnerName: string;
        role: string;
        status: string;
      }>;
    }>('/auth/login', { username, password }),
  me: () =>
    api.get<
      DriverPortalProfileDto['user'] & {
        name: string;
        fleetOwnerId?: string;
        fleetOwnerName?: string;
        fleetMemberships?: Array<{
          membershipId: string;
          fleetOwnerId: string;
          fleetOwnerName: string;
          role: string;
          status: string;
        }>;
      }
    >('/auth/me'),
  selectFleet: (fleetOwnerId: string) =>
    api.post<{ accessToken: string; refreshToken: string; fleetOwnerId: string; fleetOwnerName: string }>(
      '/auth/select-fleet',
      { fleetOwnerId },
    ),
};

export const driverPortalApi = {
  me: () => api.get<DriverPortalProfileDto>('/driver-portal/me'),
  overview: () => api.get<DriverPortalOverviewDto>('/driver-portal/overview'),
  currentAssignment: () => api.get<DriverPortalAssignmentDto | null>('/driver-portal/assignment/current'),
  currentShift: () => api.get<ShiftResponseDto | null>('/driver-portal/shift/current'),
  startShift: (data?: { openingMileage?: number; notes?: string }) =>
    api.post<ShiftResponseDto>('/driver-portal/shift/start', data ?? {}),
  endOfDay: (shiftId: string, data: EndOfDayInput) =>
    api.post<EndOfDayResultDto>(`/driver-portal/shift/${shiftId}/end-of-day`, data),
  shiftHistory: (params?: { page?: number; limit?: number }) =>
    api.get<PaginatedResponse<ShiftResponseDto>>('/driver-portal/shift/history', { params }),
  documents: (params?: { page?: number; limit?: number }) =>
    api.get<PaginatedResponse<DocumentResponseDto>>('/driver-portal/documents', { params }),
  notifications: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<NotificationResponseDto>>('/driver-portal/notifications', { params }),
  markNotificationRead: (id: string) =>
    api.post<NotificationResponseDto>(`/driver-portal/notifications/${id}/read`),
  markAllNotificationsRead: () => api.post<{ updated: number }>('/driver-portal/notifications/read-all'),
};

export { unwrapPaginated } from '../types/api';
