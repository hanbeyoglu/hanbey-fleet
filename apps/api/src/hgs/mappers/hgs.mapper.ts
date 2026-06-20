import { HgsTransit, Vehicle, Shift } from '@prisma/client';
import {
  HgsShiftSummaryDto,
  HgsTransitResponseDto,
  HgsVehicleSummaryDto,
} from '../dto/hgs-transit-response.dto';
import { PaginatedResponse, PaginationMeta, ShiftStatus } from '@hanbey-fleet/shared';

type DecimalLike = { toNumber(): number } | number | null | undefined;

type HgsTransitWithRelations = HgsTransit & {
  vehicle?: Pick<Vehicle, 'id' | 'plate' | 'hgsTag'>;
  shift?: Pick<Shift, 'id' | 'status'> | null;
};

export class HgsMapper {
  static toResponse(transit: HgsTransitWithRelations): HgsTransitResponseDto {
    return {
      id: transit.id,
      vehicleId: transit.vehicleId,
      shiftId: transit.shiftId,
      transitTime: transit.transitTime,
      tollBooth: transit.tollBooth,
      amount: HgsMapper.toNumber(transit.amount),
      provider: transit.provider,
      referenceNo: transit.referenceNo,
      syncedAt: transit.syncedAt,
      createdAt: transit.createdAt,
      updatedAt: transit.updatedAt,
      vehicle: transit.vehicle ? HgsMapper.toVehicleSummary(transit.vehicle) : undefined,
      shift: transit.shift ? HgsMapper.toShiftSummary(transit.shift) : null,
    };
  }

  static toPaginatedResponse(
    transits: HgsTransitWithRelations[],
    meta: PaginationMeta,
  ): PaginatedResponse<HgsTransitResponseDto> {
    return {
      data: transits.map(HgsMapper.toResponse),
      meta,
    };
  }

  private static toVehicleSummary(
    vehicle: Pick<Vehicle, 'id' | 'plate' | 'hgsTag'>,
  ): HgsVehicleSummaryDto {
    return { id: vehicle.id, plate: vehicle.plate, hgsTag: vehicle.hgsTag };
  }

  private static toShiftSummary(shift: Pick<Shift, 'id' | 'status'>): HgsShiftSummaryDto {
    return { id: shift.id, status: shift.status as ShiftStatus };
  }

  private static toNumber(value: DecimalLike): number {
    if (value === null || value === undefined) return 0;
    return typeof value === 'number' ? value : value.toNumber();
  }
}
