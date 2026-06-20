import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { ShiftStatus } from '@prisma/client';
import { ShiftsRepository } from './shifts.repository';
import { VehiclesRepository } from '../vehicles/vehicles.repository';
import { DriversRepository } from '../drivers/drivers.repository';
import { TimelineRepository } from '../timeline/timeline.repository';
import { StartShiftDto } from './dto/start-shift.dto';
import { EndShiftDto } from './dto/end-shift.dto';
import { CancelShiftDto } from './dto/cancel-shift.dto';
import { ShiftCurrentQueryDto } from './dto/shift-current-query.dto';
import { ShiftHistoryQueryDto } from './dto/shift-history-query.dto';
import { ShiftResponseDto } from './dto/shift-response.dto';
import { ShiftMapper } from './mappers/shift.mapper';
import { computePlannedTimes } from './utils/compute-planned-times';
import { TimelineEventType, VehicleStatus, PaginatedResponse } from '@hanbey-fleet/shared';

@Injectable()
export class ShiftsService {
  constructor(
    private shiftsRepo: ShiftsRepository,
    private vehiclesRepo: VehiclesRepository,
    private driversRepo: DriversRepository,
    private timelineRepo: TimelineRepository,
  ) {}

  async startShift(dto: StartShiftDto): Promise<ShiftResponseDto> {
    const vehicle = await this.vehiclesRepo.findByIdForShift(dto.vehicleId);
    if (!vehicle) throw new NotFoundException(`Vehicle ${dto.vehicleId} not found`);

    if (vehicle.status !== VehicleStatus.IDLE) {
      throw new BadRequestException(
        `Vehicle must be IDLE to start a shift. Current status: ${vehicle.status}`,
      );
    }

    const driver = await this.driversRepo.findByIdForShift(dto.driverId);
    if (!driver) throw new NotFoundException(`Driver ${dto.driverId} not found`);
    if (!driver.user.isActive) {
      throw new BadRequestException('Driver account is not active');
    }

    if (await this.vehiclesRepo.hasActiveShift(dto.vehicleId)) {
      throw new ConflictException('Vehicle already has an active shift');
    }

    if (await this.driversRepo.hasActiveShift(dto.driverId)) {
      throw new ConflictException('Driver already has an active shift');
    }

    if (dto.openingMileage < vehicle.currentMileage) {
      throw new BadRequestException(
        `Opening mileage (${dto.openingMileage}) cannot be less than vehicle current mileage (${vehicle.currentMileage})`,
      );
    }

    const actualStart = new Date();
    const { type, plannedStart, plannedEnd } = computePlannedTimes(actualStart);

    const shift = await this.shiftsRepo.runInTransaction(async (tx) => {
      const created = await this.shiftsRepo.create(
        {
          vehicleId: dto.vehicleId,
          driverId: dto.driverId,
          plannedStart,
          plannedEnd,
          actualStart,
          status: ShiftStatus.ACTIVE,
          type,
          openingMileage: dto.openingMileage,
          notes: dto.notes,
        },
        tx,
      );

      await this.vehiclesRepo.updateOperationalState(
        dto.vehicleId,
        { status: VehicleStatus.ACTIVE_SHIFT },
        tx,
      );

      await this.timelineRepo.create(
        {
          vehicleId: dto.vehicleId,
          shiftId: created.id,
          eventType: TimelineEventType.SHIFT_STARTED,
          description: `Shift started for vehicle ${vehicle.plate} with driver ${driver.user.name}`,
          metadata: {
            shiftId: created.id,
            driverId: dto.driverId,
            openingMileage: dto.openingMileage,
          },
        },
        tx,
      );

      return created;
    });

    return ShiftMapper.toResponse(shift);
  }

  async endShift(id: string, dto: EndShiftDto): Promise<ShiftResponseDto> {
    const shift = await this.shiftsRepo.findById(id);
    if (!shift) throw new NotFoundException(`Shift ${id} not found`);

    this.assertTransition(shift.status, [ShiftStatus.ACTIVE], 'end');

    if (dto.closingMileage < shift.openingMileage) {
      throw new BadRequestException(
        `Closing mileage (${dto.closingMileage}) cannot be less than opening mileage (${shift.openingMileage})`,
      );
    }

    const actualEnd = new Date();
    const vehiclePlate = shift.vehicle?.plate ?? shift.vehicleId;

    const updated = await this.shiftsRepo.runInTransaction(async (tx) => {
      const completed = await this.shiftsRepo.update(
        id,
        {
          status: ShiftStatus.COMPLETED,
          actualEnd,
          closingMileage: dto.closingMileage,
          notes: dto.notes ?? shift.notes ?? undefined,
        },
        tx,
      );

      await this.vehiclesRepo.updateOperationalState(
        shift.vehicleId,
        { status: VehicleStatus.IDLE, currentMileage: dto.closingMileage },
        tx,
      );

      await this.timelineRepo.create(
        {
          vehicleId: shift.vehicleId,
          shiftId: id,
          eventType: TimelineEventType.SHIFT_COMPLETED,
          description: `Shift completed for vehicle ${vehiclePlate}`,
          metadata: {
            shiftId: id,
            openingMileage: shift.openingMileage,
            closingMileage: dto.closingMileage,
          },
        },
        tx,
      );

      return completed;
    });

    return ShiftMapper.toResponse(updated);
  }

  async cancelShift(id: string, dto: CancelShiftDto): Promise<ShiftResponseDto> {
    const shift = await this.shiftsRepo.findById(id);
    if (!shift) throw new NotFoundException(`Shift ${id} not found`);

    this.assertTransition(shift.status, [ShiftStatus.ACTIVE], 'cancel');

    const actualEnd = new Date();
    const vehiclePlate = shift.vehicle?.plate ?? shift.vehicleId;

    const updated = await this.shiftsRepo.runInTransaction(async (tx) => {
      const cancelled = await this.shiftsRepo.update(
        id,
        {
          status: ShiftStatus.CANCELLED,
          actualEnd,
          cancelReason: dto.reason,
        },
        tx,
      );

      await this.vehiclesRepo.updateOperationalState(
        shift.vehicleId,
        { status: VehicleStatus.IDLE },
        tx,
      );

      await this.timelineRepo.create(
        {
          vehicleId: shift.vehicleId,
          shiftId: id,
          eventType: TimelineEventType.SHIFT_CANCELLED,
          description: `Shift cancelled for vehicle ${vehiclePlate}: ${dto.reason}`,
          metadata: { shiftId: id, reason: dto.reason },
        },
        tx,
      );

      return cancelled;
    });

    return ShiftMapper.toResponse(updated);
  }

  async getCurrent(query: ShiftCurrentQueryDto): Promise<ShiftResponseDto[]> {
    const shifts = await this.shiftsRepo.findCurrent(query);
    return shifts.map(ShiftMapper.toResponse);
  }

  async getHistory(query: ShiftHistoryQueryDto): Promise<PaginatedResponse<ShiftResponseDto>> {
    const { data, total, page, limit } = await this.shiftsRepo.findHistory(query);

    return ShiftMapper.toPaginatedResponse(data, {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    });
  }

  private assertTransition(current: ShiftStatus, allowed: ShiftStatus[], action: string) {
    if (allowed.includes(current)) return;

    if (current === ShiftStatus.COMPLETED || current === ShiftStatus.CANCELLED) {
      throw new BadRequestException(`Cannot ${action} a shift that is already ${current}`);
    }

    throw new BadRequestException(`Cannot ${action} shift with status ${current}`);
  }
}
