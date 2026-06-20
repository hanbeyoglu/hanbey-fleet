import { Shift, Vehicle, Driver, User } from '@prisma/client';
import {
  ShiftResponseDto,
  ShiftVehicleSummaryDto,
  ShiftDriverSummaryDto,
} from '../dto/shift-response.dto';
import { PaginatedResponse, PaginationMeta, ShiftStatus, ShiftType } from '@hanbey-fleet/shared';

type ShiftWithRelations = Shift & {
  vehicle?: Pick<Vehicle, 'id' | 'plate' | 'brand' | 'model'>;
  driver?: Driver & {
    user: Pick<User, 'name' | 'username' | 'email'>;
  };
};

export class ShiftMapper {
  static toResponse(shift: ShiftWithRelations): ShiftResponseDto {
    return {
      id: shift.id,
      vehicleId: shift.vehicleId,
      driverId: shift.driverId,
      status: shift.status as ShiftStatus,
      type: shift.type as ShiftType | null,
      plannedStart: shift.plannedStart,
      plannedEnd: shift.plannedEnd,
      actualStart: shift.actualStart,
      actualEnd: shift.actualEnd,
      openingMileage: shift.openingMileage,
      closingMileage: shift.closingMileage,
      cancelReason: shift.cancelReason,
      notes: shift.notes,
      createdAt: shift.createdAt,
      updatedAt: shift.updatedAt,
      vehicle: shift.vehicle ? ShiftMapper.toVehicleSummary(shift.vehicle) : undefined,
      driver: shift.driver ? ShiftMapper.toDriverSummary(shift.driver) : undefined,
    };
  }

  static toPaginatedResponse(
    shifts: ShiftWithRelations[],
    meta: PaginationMeta,
  ): PaginatedResponse<ShiftResponseDto> {
    return {
      data: shifts.map(ShiftMapper.toResponse),
      meta,
    };
  }

  private static toVehicleSummary(
    vehicle: Pick<Vehicle, 'id' | 'plate' | 'brand' | 'model'>,
  ): ShiftVehicleSummaryDto {
    return {
      id: vehicle.id,
      plate: vehicle.plate,
      brand: vehicle.brand,
      model: vehicle.model,
    };
  }

  private static toDriverSummary(
    driver: Driver & { user: Pick<User, 'name' | 'username' | 'email'> },
  ): ShiftDriverSummaryDto {
    return {
      id: driver.id,
      name: driver.user.name,
      username: driver.user.username,
      email: driver.user.email,
    };
  }
}
