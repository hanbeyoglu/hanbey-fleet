import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { VehiclesRepository } from './vehicles.repository';
import { TimelineService } from '../timeline/timeline.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { TimelineEventType } from '@hanbey-fleet/shared';

@Injectable()
export class VehiclesService {
  constructor(
    private repo: VehiclesRepository,
    private timeline: TimelineService,
  ) {}

  findAll() {
    return this.repo.findAll();
  }

  async findOne(id: string) {
    const vehicle = await this.repo.findById(id);
    if (!vehicle) throw new NotFoundException(`Vehicle ${id} not found`);
    return vehicle;
  }

  async create(dto: CreateVehicleDto) {
    const existing = await this.repo.findByPlate(dto.plate);
    if (existing) throw new ConflictException(`Plate ${dto.plate} already exists`);

    const vehicle = await this.repo.create(dto);

    await this.timeline.create({
      vehicleId: vehicle.id,
      eventType: TimelineEventType.VEHICLE_CREATED,
      description: `Vehicle ${vehicle.plate} (${vehicle.brand} ${vehicle.model} ${vehicle.year}) registered`,
      metadata: { plate: vehicle.plate, brand: vehicle.brand, model: vehicle.model },
    });

    return vehicle;
  }

  async update(id: string, dto: UpdateVehicleDto) {
    const existing = await this.findOne(id);

    if (dto.status && dto.status !== existing.status) {
      await this.timeline.create({
        vehicleId: id,
        eventType: TimelineEventType.VEHICLE_STATUS_CHANGED,
        description: `Vehicle status changed from ${existing.status} to ${dto.status}`,
        metadata: { from: existing.status, to: dto.status },
      });
    }

    return this.repo.update(id, dto);
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.repo.softDelete(id);
  }
}
