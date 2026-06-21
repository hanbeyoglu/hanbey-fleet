import {
  Role,
  ShiftStatus,
  AssignmentStatus,
  ExpenseCategory,
  DriverReportSource,
  PaginatedResponse,
} from '@hanbey-fleet/shared';

export interface DriverPortalUserDto {
  id: string;
  username: string;
  name: string;
  email?: string | null;
  role: Role;
}

export interface DriverPortalProfileDto {
  driverId: string;
  licenseNo: string;
  phone: string;
  address?: string | null;
  user: DriverPortalUserDto;
}

export interface DriverPortalVehicleDto {
  id: string;
  plate: string;
  brand: string;
  model: string;
  currentMileage: number;
  dailyFee: number;
}

export interface DriverPortalAssignmentDto {
  id: string;
  assignedAt: string;
  status: AssignmentStatus;
  vehicle: DriverPortalVehicleDto;
}

export interface ShiftResponseDto {
  id: string;
  vehicleId: string;
  driverId: string;
  status: ShiftStatus;
  plannedStart: string;
  plannedEnd: string;
  actualStart?: string | null;
  actualEnd?: string | null;
  openingMileage: number;
  closingMileage?: number | null;
  notes?: string | null;
  vehicle?: { plate: string; brand: string; model: string };
}

export interface DriverPortalOverviewDto {
  profile: DriverPortalProfileDto;
  currentAssignment?: DriverPortalAssignmentDto | null;
  activeShift?: ShiftResponseDto | null;
  canStartShift: boolean;
  canSubmitEndOfDay: boolean;
}

export interface EndOfDayExpenseInput {
  category: ExpenseCategory;
  amount: number;
  note?: string;
}

export interface EndOfDayInput {
  declaredHgs?: number;
  posAmount?: number;
  expenses?: EndOfDayExpenseInput[];
  updateMileage?: boolean;
  closingMileage?: number;
  notes?: string;
}

export interface DriverReportResponseDto {
  id: string;
  shiftId: string;
  source: DriverReportSource;
  declaredRevenue: number;
  declaredHgs: number;
  declaredTotal: number;
  posRevenue?: number | null;
  notes?: string | null;
  isApproved: boolean;
}

export interface ExpenseResponseDto {
  id: string;
  category: ExpenseCategory;
  amount: number;
  note?: string | null;
}

export interface EndOfDayResultDto {
  cashToDeliver: number;
  dailyFee: number;
  declaredHgs: number;
  posAmount: number;
  totalExpenses: number;
  shift: ShiftResponseDto;
  driverReport: DriverReportResponseDto;
  expenses: ExpenseResponseDto[];
}

export interface DocumentResponseDto {
  id: string;
  title: string;
  type: string;
  issueDate?: string | null;
  expiryDate?: string | null;
  status?: string;
}

export interface NotificationResponseDto {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export function unwrapPaginated<T>(payload: PaginatedResponse<T> | T[]): {
  data: T[];
  meta?: PaginatedResponse<T>['meta'];
} {
  if (Array.isArray(payload)) return { data: payload };
  return { data: payload.data ?? [], meta: payload.meta };
}
