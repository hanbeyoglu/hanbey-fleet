import { Settlement, Shift, Driver, Vehicle, User } from '@prisma/client';
import {
  SettlementApproverSummaryDto,
  SettlementDriverSummaryDto,
  SettlementResponseDto,
  SettlementShiftSummaryDto,
  SettlementVehicleSummaryDto,
} from '../dto/settlement-response.dto';
import { PaginatedResponse, PaginationMeta, SettlementStatus } from '@hanbey-fleet/shared';

type DecimalLike = { toNumber(): number } | number | null | undefined;

type SettlementWithRelations = Settlement & {
  shift?: Shift & {
    driver?: Driver & { user?: Pick<User, 'id' | 'name' | 'username'> };
    vehicle?: Pick<Vehicle, 'id' | 'plate' | 'brand' | 'model'>;
  };
  approvedBy?: Pick<User, 'id' | 'name' | 'username'> | null;
};

export class SettlementMapper {
  static toResponse(settlement: SettlementWithRelations): SettlementResponseDto {
    return {
      id: settlement.id,
      shiftId: settlement.shiftId,
      driverReportId: settlement.driverReportId,
      declaredRevenue: SettlementMapper.toNumber(settlement.declaredRevenue),
      declaredHgs: SettlementMapper.toNumber(settlement.declaredHgs),
      actualHgs: SettlementMapper.toNumber(settlement.actualHgs),
      expenses: SettlementMapper.toNumber(settlement.expenses),
      difference: SettlementMapper.toNumber(settlement.difference),
      netRevenue: SettlementMapper.toNumber(settlement.netRevenue),
      status: settlement.status as SettlementStatus,
      approvedById: settlement.approvedById,
      approvedAt: settlement.approvedAt,
      createdAt: settlement.createdAt,
      updatedAt: settlement.updatedAt,
      shift: settlement.shift ? SettlementMapper.toShiftSummary(settlement.shift) : undefined,
      approvedBy: settlement.approvedBy
        ? SettlementMapper.toApproverSummary(settlement.approvedBy)
        : null,
    };
  }

  static toPaginatedResponse(
    settlements: SettlementWithRelations[],
    meta: PaginationMeta,
  ): PaginatedResponse<SettlementResponseDto> {
    return {
      data: settlements.map(SettlementMapper.toResponse),
      meta,
    };
  }

  private static toShiftSummary(
    shift: Shift & {
      driver?: Driver & { user?: Pick<User, 'id' | 'name' | 'username'> };
      vehicle?: Pick<Vehicle, 'id' | 'plate' | 'brand' | 'model'>;
    },
  ): SettlementShiftSummaryDto {
    return {
      id: shift.id,
      vehicleId: shift.vehicleId,
      driverId: shift.driverId,
      actualStart: shift.actualStart,
      actualEnd: shift.actualEnd,
      driver: shift.driver?.user
        ? SettlementMapper.toDriverSummary(shift.driver.user)
        : undefined,
      vehicle: shift.vehicle ? SettlementMapper.toVehicleSummary(shift.vehicle) : undefined,
    };
  }

  private static toDriverSummary(
    user: Pick<User, 'id' | 'name' | 'username'>,
  ): SettlementDriverSummaryDto {
    return { id: user.id, name: user.name, username: user.username };
  }

  private static toVehicleSummary(
    vehicle: Pick<Vehicle, 'id' | 'plate' | 'brand' | 'model'>,
  ): SettlementVehicleSummaryDto {
    return {
      id: vehicle.id,
      plate: vehicle.plate,
      brand: vehicle.brand,
      model: vehicle.model,
    };
  }

  private static toApproverSummary(
    user: Pick<User, 'id' | 'name' | 'username'>,
  ): SettlementApproverSummaryDto {
    return { id: user.id, name: user.name, username: user.username };
  }

  private static toNumber(value: DecimalLike): number {
    if (value === null || value === undefined) return 0;
    return typeof value === 'number' ? value : value.toNumber();
  }
}
