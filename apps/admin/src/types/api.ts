import {
  PaginatedResponse,
  TimelineEventType,
  VehicleStatus,
  ShiftStatus,
  ShiftType,
  ExpenseCategory,
} from '@hanbey-fleet/shared';

export interface VehicleResponseDto {
  id: string;
  plate: string;
  brand: string;
  model: string;
  year: number;
  color?: string | null;
  status: VehicleStatus;
  currentMileage: number;
  hgsTag?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ActiveShiftSummaryDto {
  id: string;
  driverName: string;
  driverUsername: string;
  driverEmail?: string | null;
  plannedStart: string;
  plannedEnd: string;
  actualStart?: string | null;
}

export interface TimelineEventSummaryDto {
  id: string;
  eventType: TimelineEventType | string;
  description: string;
  eventTime: string;
  metadata?: Record<string, unknown> | null;
}

export interface VehicleDetailResponseDto extends VehicleResponseDto {
  activeShift?: ActiveShiftSummaryDto | null;
  timelineEvents: TimelineEventSummaryDto[];
}

export interface ShiftDriverSummaryDto {
  id: string;
  name: string;
  username: string;
  email?: string | null;
}

export interface ShiftResponseDto {
  id: string;
  vehicleId: string;
  driverId: string;
  status: ShiftStatus;
  type?: ShiftType | null;
  plannedStart: string;
  plannedEnd: string;
  actualStart?: string | null;
  actualEnd?: string | null;
  openingMileage: number;
  closingMileage?: number | null;
  driver?: ShiftDriverSummaryDto;
}

export interface DriverUserSummary {
  id: string;
  name: string;
  username: string;
  email?: string | null;
  role: string;
  isActive: boolean;
}

export interface DriverShiftSummary {
  id: string;
  vehicleId: string;
  status: ShiftStatus;
  vehicle?: { id: string; plate: string; brand: string; model: string };
}

export interface DriverResponseDto {
  id: string;
  licenseNo: string;
  phone: string;
  address?: string | null;
  user: DriverUserSummary;
  shifts: DriverShiftSummary[];
}

export interface TimelineEventDto extends TimelineEventSummaryDto {
  vehicleId: string;
  shiftId?: string | null;
  vehicle?: { id: string; plate: string };
}

export interface MonthlyReportVehicleSummary {
  vehicle: { id: string; plate: string; brand: string; model: string; year: number };
  expenses: {
    total: number;
    byCategory: Array<{ category: string; amount: number; count?: number }>;
  };
  hgs: { total: number; transitCount: number };
  maintenance: { total: number; count: number };
}

export interface MonthlyReportSummary {
  period: { year: number; month: number };
  vehicles: MonthlyReportVehicleSummary[];
  totals: { expenses: number; hgs: number; maintenance: number };
}

export interface ExpenseResponseDto {
  id: string;
  vehicleId: string;
  shiftId?: string | null;
  category: ExpenseCategory;
  amount: number;
  note?: string | null;
  expenseDate: string;
  receiptUrl?: string | null;
  createdAt?: string;
  updatedAt?: string;
  vehicle?: { id: string; plate: string } | null;
  shift?: { id: string; status: string } | null;
}

export interface MaintenanceRecordDto {
  id: string;
  vehicleId: string;
  description: string;
  cost: unknown;
  date: string;
  mileage?: number | null;
  serviceProvider?: string | null;
  vehicle?: { id: string; plate: string; brand: string; model: string } | null;
}

export interface HgsTransitDto {
  id: string;
  vehicleId: string;
  shiftId?: string | null;
  transitTime: string;
  tollBooth: string;
  amount: unknown;
  provider?: string | null;
  referenceNo?: string | null;
  vehicle?: { id: string; plate: string; hgsTag?: string | null } | null;
}

export type PaginatedVehicles = PaginatedResponse<VehicleResponseDto>;

export function asArray<T>(payload: unknown): T[] {
  return Array.isArray(payload) ? payload : [];
}

export function unwrapPaginated<T>(payload: PaginatedResponse<T> | T[]): {
  data: T[];
  meta?: PaginatedResponse<T>['meta'];
} {
  if (Array.isArray(payload)) {
    return { data: payload };
  }
  return { data: payload.data ?? [], meta: payload.meta };
}
