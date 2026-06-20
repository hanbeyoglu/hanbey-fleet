import { Vehicle, TimelineEvent, Shift, Driver, User } from '@prisma/client';
import {
  VehicleResponseDto,
  VehicleDetailResponseDto,
  ActiveShiftSummaryDto,
  TimelineEventSummaryDto,
} from '../dto/vehicle-response.dto';
import { PaginatedResponse, PaginationMeta, VehicleStatus } from '@hanbey-fleet/shared';

type VehicleWithRelations = Vehicle & {
  shifts?: Array<
    Shift & {
      driver: Driver & {
        user: Pick<User, 'name' | 'username' | 'email'>;
      };
    }
  >;
  timelineEvents?: TimelineEvent[];
};

export class VehicleMapper {
  static toResponse(vehicle: Vehicle): VehicleResponseDto {
    return {
      id: vehicle.id,
      plate: vehicle.plate,
      brand: vehicle.brand,
      model: vehicle.model,
      year: vehicle.year,
      color: vehicle.color,
      status: vehicle.status as VehicleStatus,
      currentMileage: vehicle.currentMileage,
      hgsTag: vehicle.hgsTag,
      notes: vehicle.notes,
      createdAt: vehicle.createdAt,
      updatedAt: vehicle.updatedAt,
    };
  }

  static toDetailResponse(vehicle: VehicleWithRelations): VehicleDetailResponseDto {
    const activeShift = vehicle.shifts?.[0];

    return {
      ...VehicleMapper.toResponse(vehicle),
      activeShift: activeShift ? VehicleMapper.toActiveShiftSummary(activeShift) : null,
      timelineEvents: (vehicle.timelineEvents ?? []).map(VehicleMapper.toTimelineSummary),
    };
  }

  static toPaginatedResponse(
    vehicles: Vehicle[],
    meta: PaginationMeta,
  ): PaginatedResponse<VehicleResponseDto> {
    return {
      data: vehicles.map(VehicleMapper.toResponse),
      meta,
    };
  }

  private static toActiveShiftSummary(
    shift: Shift & {
      driver: Driver & {
        user: Pick<User, 'name' | 'username' | 'email'>;
      };
    },
  ): ActiveShiftSummaryDto {
    return {
      id: shift.id,
      driverName: shift.driver.user.name,
      driverUsername: shift.driver.user.username,
      driverEmail: shift.driver.user.email,
      plannedStart: shift.plannedStart,
      plannedEnd: shift.plannedEnd,
      actualStart: shift.actualStart,
    };
  }

  private static toTimelineSummary(event: TimelineEvent): TimelineEventSummaryDto {
    return {
      id: event.id,
      eventType: event.eventType,
      description: event.description,
      eventTime: event.eventTime,
      metadata: event.metadata as Record<string, unknown> | null,
    };
  }
}
