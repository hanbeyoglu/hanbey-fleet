import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { JwtPayload } from '@hanbey-fleet/shared';
import { VehicleAssignmentsRepository } from './vehicle-assignments.repository';
import { VehiclesRepository } from '../vehicles/vehicles.repository';
import { DriversRepository } from '../drivers/drivers.repository';
import { TimelineRepository } from '../timeline/timeline.repository';
import { FleetScopeService } from '../common/fleet/fleet-scope.service';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { ReleaseAssignmentDto } from './dto/release-assignment.dto';
import { AssignmentListQueryDto } from './dto/assignment-list-query.dto';
import { VehicleAssignmentResponseDto } from './dto/assignment-response.dto';
import { AssignmentMapper } from './mappers/assignment.mapper';
import { TimelineEventType, PaginatedResponse } from '@hanbey-fleet/shared';

@Injectable()
export class VehicleAssignmentsService {
  constructor(
    private assignmentsRepo: VehicleAssignmentsRepository,
    private vehiclesRepo: VehiclesRepository,
    private driversRepo: DriversRepository,
    private timelineRepo: TimelineRepository,
    private fleetScope: FleetScopeService,
  ) {}

  async assign(
    user: JwtPayload,
    dto: CreateAssignmentDto,
  ): Promise<VehicleAssignmentResponseDto> {
    const scope = this.fleetScope.resolve(user);
    const fleetOwnerId = scope.fleetOwnerId;

    const vehicle = await this.vehiclesRepo.findById(dto.vehicleId, fleetOwnerId);
    if (!vehicle) throw new NotFoundException(`Vehicle ${dto.vehicleId} not found`);

    const driver = await this.driversRepo.findById(dto.driverId, fleetOwnerId);
    if (!driver) throw new NotFoundException(`Driver ${dto.driverId} not found`);

    // BR-120: Only one active assignment per vehicle
    const existingVehicleAssignment = await this.assignmentsRepo.findActiveByVehicle(
      dto.vehicleId,
      fleetOwnerId,
    );
    if (existingVehicleAssignment) {
      throw new ConflictException(
        `Vehicle ${vehicle.plate} already has an active assignment. Release it before assigning again (BR-120).`,
      );
    }

    // BR-121: Only one active assignment per driver
    const existingDriverAssignment = await this.assignmentsRepo.findActiveByDriver(
      dto.driverId,
      fleetOwnerId,
    );
    if (existingDriverAssignment) {
      throw new ConflictException(
        `Driver ${driver.user.name} already has an active assignment. Release it before assigning to another vehicle (BR-121).`,
      );
    }

    // BR-122: Assignment creation does NOT start a Shift. No shift interaction here.

    const assignment = await this.assignmentsRepo.runInTransaction(async (tx) => {
      const created = await this.assignmentsRepo.create(
        { vehicleId: dto.vehicleId, driverId: dto.driverId, assignedById: user.sub, notes: dto.notes },
        tx,
      );

      // BR-126: Generate VEHICLE_ASSIGNED timeline event automatically
      await this.timelineRepo.create(
        {
          vehicleId: dto.vehicleId,
          eventType: TimelineEventType.VEHICLE_ASSIGNED,
          description: `Vehicle ${vehicle.plate} assigned to driver ${driver.user.name}`,
          metadata: {
            assignmentId: created.id,
            driverId: dto.driverId,
            driverName: driver.user.name,
            assignedById: user.sub,
          },
        },
        tx,
      );

      return created;
    });

    return AssignmentMapper.toResponse(assignment);
  }

  async release(
    user: JwtPayload,
    id: string,
    dto: ReleaseAssignmentDto,
  ): Promise<VehicleAssignmentResponseDto> {
    const scope = this.fleetScope.resolve(user);
    const assignment = await this.assignmentsRepo.findById(id, scope.fleetOwnerId);
    if (!assignment) throw new NotFoundException(`Assignment ${id} not found`);

    // Already released — idempotent check
    if (assignment.releasedAt !== null) {
      throw new ConflictException(`Assignment ${id} has already been released`);
    }

    // BR-123: Assignment release does NOT finish a Shift. No shift interaction here.

    const released = await this.assignmentsRepo.runInTransaction(async (tx) => {
      const updated = await this.assignmentsRepo.release(
        id,
        { releasedAt: new Date(), releaseReason: dto.reason },
        tx,
      );

      // BR-127: Generate VEHICLE_RELEASED timeline event automatically
      const vehiclePlate = assignment.vehicle?.plate ?? assignment.vehicleId;
      const driverName = assignment.driver?.user?.name ?? assignment.driverId;

      await this.timelineRepo.create(
        {
          vehicleId: assignment.vehicleId,
          eventType: TimelineEventType.VEHICLE_RELEASED,
          description: `Vehicle ${vehiclePlate} released from driver ${driverName}`,
          metadata: {
            assignmentId: id,
            driverId: assignment.driverId,
            driverName,
            releaseReason: dto.reason ?? null,
          },
        },
        tx,
      );

      return updated;
    });

    return AssignmentMapper.toResponse(released);
  }

  async findAll(
    user: JwtPayload,
    query: AssignmentListQueryDto,
  ): Promise<PaginatedResponse<VehicleAssignmentResponseDto>> {
    const scope = this.fleetScope.resolve(user);
    const { data, total, page, limit } = await this.assignmentsRepo.findAll(query, scope.fleetOwnerId);

    return AssignmentMapper.toPaginatedResponse(data, {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    });
  }

  async findById(user: JwtPayload, id: string): Promise<VehicleAssignmentResponseDto> {
    const scope = this.fleetScope.resolve(user);
    const assignment = await this.assignmentsRepo.findById(id, scope.fleetOwnerId);
    if (!assignment) throw new NotFoundException(`Assignment ${id} not found`);
    return AssignmentMapper.toResponse(assignment);
  }

  async getHistory(
    user: JwtPayload,
    page: number,
    limit: number,
  ): Promise<PaginatedResponse<VehicleAssignmentResponseDto>> {
    const scope = this.fleetScope.resolve(user);
    const { data, total } = await this.assignmentsRepo.findHistory(page, limit, scope.fleetOwnerId);

    return AssignmentMapper.toPaginatedResponse(data, {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    });
  }
}
