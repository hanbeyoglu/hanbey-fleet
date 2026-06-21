import { Prisma } from '@prisma/client';
import { FleetScope } from './fleet-scope.types';

export function scopedVehicleFilter(
  scope: FleetScope,
): Prisma.VehicleWhereInput | undefined {
  if (scope.isGlobal) return undefined;
  return { fleetOwnerId: scope.fleetOwnerId!, deletedAt: null };
}

export function scopedExpenseFilter(
  scope: FleetScope,
): Prisma.ExpenseWhereInput | undefined {
  const vehicle = scopedVehicleFilter(scope);
  if (!vehicle) return undefined;
  return { vehicle };
}

export function scopedShiftFilter(
  scope: FleetScope,
): Prisma.ShiftWhereInput | undefined {
  const vehicle = scopedVehicleFilter(scope);
  if (!vehicle) return undefined;
  return { vehicle, deletedAt: null };
}

export function scopedHgsFilter(
  scope: FleetScope,
): Prisma.HgsTransitWhereInput | undefined {
  const vehicle = scopedVehicleFilter(scope);
  if (!vehicle) return undefined;
  return { vehicle };
}

export function scopedMaintenanceFilter(
  scope: FleetScope,
): Prisma.MaintenanceRecordWhereInput | undefined {
  const vehicle = scopedVehicleFilter(scope);
  if (!vehicle) return undefined;
  return { vehicle, deletedAt: null };
}

export function scopedSettlementFilter(
  scope: FleetScope,
): Prisma.SettlementWhereInput | undefined {
  const shift = scopedShiftFilter(scope);
  if (!shift) return undefined;
  return { shift };
}

export function scopedAssignmentFilter(
  scope: FleetScope,
): Prisma.VehicleAssignmentWhereInput | undefined {
  const vehicle = scopedVehicleFilter(scope);
  if (!vehicle) return undefined;
  return { vehicle };
}

export function scopedTimelineFilter(
  scope: FleetScope,
): Prisma.TimelineEventWhereInput | undefined {
  const vehicle = scopedVehicleFilter(scope);
  if (!vehicle) return undefined;
  return { vehicle };
}

export function scopedDriverFilter(
  scope: FleetScope,
): Prisma.DriverWhereInput | undefined {
  if (scope.isGlobal) return undefined;
  return {
    deletedAt: null,
    user: {
      fleetMemberships: {
        some: { fleetOwnerId: scope.fleetOwnerId!, status: 'ACTIVE' },
      },
    },
  };
}

export function scopedDriverReportFilter(
  scope: FleetScope,
): Prisma.DriverReportWhereInput | undefined {
  const shift = scopedShiftFilter(scope);
  if (!shift) return undefined;
  return { shift };
}

export function scopedImportFilter(
  scope: FleetScope,
): Prisma.ImportJobWhereInput | undefined {
  const shift = scopedShiftFilter(scope);
  if (!shift) return undefined;
  return { driverReport: { shift } };
}

export function mergeWhere<T extends Record<string, unknown>>(
  base: T,
  scopeFilter: T | undefined,
): T {
  if (!scopeFilter) return base;
  return { ...base, ...scopeFilter };
}
