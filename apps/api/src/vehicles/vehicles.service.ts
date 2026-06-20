import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { VehiclesRepository } from './vehicles.repository';
import { TimelineService } from '../timeline/timeline.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { VehicleListQueryDto } from './dto/vehicle-list-query.dto';
import { VehicleMapper } from './mappers/vehicle.mapper';
import { normalizePlate } from './utils/normalize-plate';
import { TimelineEventType, PaginatedResponse, VehicleStatus } from '@hanbey-fleet/shared';
import { VehicleResponseDto, VehicleDetailResponseDto } from './dto/vehicle-response.dto';

@Injectable()
export class VehiclesService {
  constructor(
    private repo: VehiclesRepository,
    private timeline: TimelineService,
  ) {}

  async findAll(query: VehicleListQueryDto): Promise<PaginatedResponse<VehicleResponseDto>> {
    const { data, total, page, limit } = await this.repo.findMany(query);

    return VehicleMapper.toPaginatedResponse(data, {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    });
  }

  async findOne(id: string): Promise<VehicleDetailResponseDto> {
    const vehicle = await this.repo.findById(id);
    if (!vehicle) throw new NotFoundException(`Vehicle ${id} not found`);
    return VehicleMapper.toDetailResponse(vehicle);
  }

  async create(dto: CreateVehicleDto): Promise<VehicleResponseDto> {
    const plate = normalizePlate(dto.plate);
    const existing = await this.repo.findActiveByPlate(plate);
    if (existing) throw new ConflictException(`Plate ${plate} already exists`);

    const vehicle = await this.repo.create({ ...dto, plate });

    await this.timeline.create({
      vehicleId: vehicle.id,
      eventType: TimelineEventType.VEHICLE_CREATED,
      description: `Vehicle ${vehicle.plate} (${vehicle.brand} ${vehicle.model} ${vehicle.year}) registered`,
      metadata: { plate: vehicle.plate, brand: vehicle.brand, model: vehicle.model },
    });

    return VehicleMapper.toResponse(vehicle);
  }

  async update(id: string, dto: UpdateVehicleDto): Promise<VehicleResponseDto> {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundException(`Vehicle ${id} not found`);

    const updateData = { ...dto };

    if (dto.plate) {
      const plate = normalizePlate(dto.plate);
      if (plate !== existing.plate) {
        const plateTaken = await this.repo.findActiveByPlate(plate);
        if (plateTaken && plateTaken.id !== id) {
          throw new ConflictException(`Plate ${plate} already exists`);
        }
      }
      updateData.plate = plate;
    }

    if (dto.status && dto.status !== existing.status) {
      await this.validateStatusChange(existing.id, dto.status);
      await this.timeline.create({
        vehicleId: id,
        eventType: TimelineEventType.VEHICLE_STATUS_CHANGED,
        description: `Vehicle status changed from ${existing.status} to ${dto.status}`,
        metadata: { from: existing.status, to: dto.status },
      });
    }

    const vehicle = await this.repo.update(id, updateData);
    return VehicleMapper.toResponse(vehicle);
  }

  async remove(id: string): Promise<VehicleResponseDto> {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundException(`Vehicle ${id} not found`);

    const hasActiveShift = await this.repo.hasActiveShift(id);
    if (hasActiveShift) {
      throw new BadRequestException('Cannot delete a vehicle with an active shift');
    }

    const vehicle = await this.repo.softDelete(id);

    await this.timeline.create({
      vehicleId: id,
      eventType: TimelineEventType.VEHICLE_DELETED,
      description: `Vehicle ${existing.plate} removed from fleet`,
      metadata: { plate: existing.plate },
    });

    return VehicleMapper.toResponse(vehicle);
  }

  private async validateStatusChange(vehicleId: string, newStatus: VehicleStatus) {
    if (newStatus !== VehicleStatus.ACTIVE_SHIFT) return;

    const hasActiveShift = await this.repo.hasActiveShift(vehicleId);
    if (!hasActiveShift) {
      throw new BadRequestException(
        'Cannot set status to ACTIVE_SHIFT without an active shift',
      );
    }
  }
}
