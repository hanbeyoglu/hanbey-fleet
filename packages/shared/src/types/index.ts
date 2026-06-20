export enum Role {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  DRIVER = 'DRIVER',
}

export enum VehicleStatus {
  IDLE = 'IDLE',
  ACTIVE_SHIFT = 'ACTIVE_SHIFT',
  MAINTENANCE = 'MAINTENANCE',
  OUT_OF_SERVICE = 'OUT_OF_SERVICE',
}

export enum ShiftStatus {
  PLANNED = 'PLANNED',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum ShiftType {
  DAY = 'DAY',
  NIGHT = 'NIGHT',
}

export enum ExpenseCategory {
  FUEL = 'FUEL',
  MAINTENANCE = 'MAINTENANCE',
  INSURANCE = 'INSURANCE',
  TAX = 'TAX',
  PENALTY = 'PENALTY',
  CLEANING = 'CLEANING',
  PARKING = 'PARKING',
  OTHER = 'OTHER',
}

export enum DriverReportSource {
  MANUAL = 'MANUAL',
  WHATSAPP = 'WHATSAPP',
  MOBILE = 'MOBILE',
  OCR = 'OCR',
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export enum VehicleSortField {
  CREATED_AT = 'createdAt',
  PLATE = 'plate',
  BRAND = 'brand',
  MODEL = 'model',
  YEAR = 'year',
  STATUS = 'status',
}

export enum TimelineEventType {
  VEHICLE_CREATED = 'VEHICLE_CREATED',
  VEHICLE_DELETED = 'VEHICLE_DELETED',
  VEHICLE_STATUS_CHANGED = 'VEHICLE_STATUS_CHANGED',
  SHIFT_STARTED = 'SHIFT_STARTED',
  SHIFT_COMPLETED = 'SHIFT_COMPLETED',
  SHIFT_CANCELLED = 'SHIFT_CANCELLED',
  DRIVER_REPORT_SUBMITTED = 'DRIVER_REPORT_SUBMITTED',
  DRIVER_REPORT_APPROVED = 'DRIVER_REPORT_APPROVED',
  EXPENSE_CREATED = 'EXPENSE_CREATED',
  MAINTENANCE_COMPLETED = 'MAINTENANCE_COMPLETED',
  HGS_IMPORTED = 'HGS_IMPORTED',
}

export enum NotificationType {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  SUCCESS = 'SUCCESS',
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
  iat?: number;
  exp?: number;
}
