import { VehicleAssignment, Vehicle, Driver, User } from '@prisma/client';
import {
  VehicleAssignmentResponseDto,
  AssignmentVehicleSummaryDto,
  AssignmentDriverSummaryDto,
  AssignmentUserSummaryDto,
} from '../dto/assignment-response.dto';
import { AssignmentStatus, PaginatedResponse, PaginationMeta } from '@hanbey-fleet/shared';

type AssignmentWithRelations = VehicleAssignment & {
  vehicle?: Pick<Vehicle, 'id' | 'plate' | 'brand' | 'model'>;
  driver?: Driver & { user: Pick<User, 'name' | 'username'> };
  assignedBy?: Pick<User, 'id' | 'name' | 'username'>;
};

export class AssignmentMapper {
  static toResponse(assignment: AssignmentWithRelations): VehicleAssignmentResponseDto {
    return {
      id: assignment.id,
      vehicleId: assignment.vehicleId,
      driverId: assignment.driverId,
      assignedById: assignment.assignedById,
      assignedAt: assignment.assignedAt,
      releasedAt: assignment.releasedAt,
      releaseReason: assignment.releaseReason,
      notes: assignment.notes,
      status: assignment.releasedAt ? AssignmentStatus.RELEASED : AssignmentStatus.ACTIVE,
      createdAt: assignment.createdAt,
      updatedAt: assignment.updatedAt,
      vehicle: assignment.vehicle
        ? AssignmentMapper.toVehicleSummary(assignment.vehicle)
        : undefined,
      driver: assignment.driver
        ? AssignmentMapper.toDriverSummary(assignment.driver)
        : undefined,
      assignedBy: assignment.assignedBy
        ? AssignmentMapper.toUserSummary(assignment.assignedBy)
        : undefined,
    };
  }

  static toPaginatedResponse(
    assignments: AssignmentWithRelations[],
    meta: PaginationMeta,
  ): PaginatedResponse<VehicleAssignmentResponseDto> {
    return {
      data: assignments.map(AssignmentMapper.toResponse),
      meta,
    };
  }

  private static toVehicleSummary(
    vehicle: Pick<Vehicle, 'id' | 'plate' | 'brand' | 'model'>,
  ): AssignmentVehicleSummaryDto {
    return { id: vehicle.id, plate: vehicle.plate, brand: vehicle.brand, model: vehicle.model };
  }

  private static toDriverSummary(
    driver: Driver & { user: Pick<User, 'name' | 'username'> },
  ): AssignmentDriverSummaryDto {
    return { id: driver.id, name: driver.user.name, username: driver.user.username };
  }

  private static toUserSummary(
    user: Pick<User, 'id' | 'name' | 'username'>,
  ): AssignmentUserSummaryDto {
    return { id: user.id, name: user.name, username: user.username };
  }
}
