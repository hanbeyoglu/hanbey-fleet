import {
  PaginatedResponse,
  TimelineEventType,
  VehicleStatus,
  ShiftStatus,
  ShiftType,
  ExpenseCategory,
  SettlementStatus,
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

export interface SettlementResponseDto {
  id: string;
  shiftId: string;
  driverReportId: string;
  declaredRevenue: number;
  declaredHgs: number;
  actualHgs: number;
  expenses: number;
  difference: number;
  netRevenue: number;
  status: SettlementStatus;
  approvedById?: string | null;
  approvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  shift?: {
    id: string;
    vehicleId: string;
    driverId: string;
    actualStart?: string | null;
    actualEnd?: string | null;
    driver?: { id: string; name: string; username: string };
    vehicle?: { id: string; plate: string; brand: string; model: string };
  };
  approvedBy?: { id: string; name: string; username: string } | null;
}

export interface NotificationResponseDto {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  readAt?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface ParsedImportContentDto {
  shiftId?: string;
  declaredRevenue?: number;
  declaredHgs?: number;
  declaredTotal?: number;
  notes?: string;
}

export interface ImportResponseDto {
  id: string;
  source: string;
  status: string;
  rawContent: string;
  parsedContent?: ParsedImportContentDto | null;
  driverReportId?: string | null;
  error?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SchedulerJobDto {
  name: string;
  label: string;
  schedule: string;
  status: string;
  lastRunAt?: string | null;
  nextRunAt?: string | null;
  lastDurationMs?: number | null;
  lastError?: string | null;
}

export interface SchedulerStatusDto {
  enabled: boolean;
  jobs: SchedulerJobDto[];
}

export interface DocumentRevisionDto {
  id: string;
  version: number;
  fileName: string;
  fileUrl: string;
  mimeType: string;
  size: number;
  createdAt: string;
}

export interface DocumentResponseDto {
  id: string;
  ownerType: string;
  ownerId: string;
  ownerLabel?: string | null;
  title: string;
  type: string;
  issueDate?: string | null;
  expiryDate?: string | null;
  status: string;
  currentRevision: DocumentRevisionDto;
  revisions: DocumentRevisionDto[];
  createdAt: string;
  updatedAt: string;
}

export interface DashboardChartPointDto {
  date: string;
  value: number;
}

export interface DashboardChartDto {
  revenue: DashboardChartPointDto[];
  expenses: DashboardChartPointDto[];
  hgs: DashboardChartPointDto[];
}

export interface DashboardOverviewDto {
  date: string;
  financialSummary: {
    today: {
      revenue: number;
      expenses: number;
      hgs: number;
      netRevenue: number;
      completedShifts: number;
      maintenanceCount: number;
    };
    settlements: {
      matched: number;
      mismatch: number;
      approved: number;
    };
  };
  fleet: {
    activeVehicles: number;
    activeDrivers: number;
  };
  timeline: {
    events: Array<{
      id: string;
      eventType: string;
      description: string;
      eventTime: string;
      vehicleId?: string;
      vehiclePlate?: string | null;
    }>;
  };
  compliance: {
    expiredCount: number;
    expiringCount: number;
    expiredDocuments: Array<{
      id: string;
      title: string;
      type: string;
      ownerType: string;
      ownerId: string;
      ownerLabel?: string | null;
      expiryDate: string;
      status: string;
    }>;
  };
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
