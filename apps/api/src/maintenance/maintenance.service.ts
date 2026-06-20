import { Injectable, NotFoundException } from '@nestjs/common';
import { MaintenanceRepository } from './maintenance.repository';
import { TimelineService } from '../timeline/timeline.service';
import { CreateMaintenanceDto } from './dto/create-maintenance.dto';
import { UpdateMaintenanceDto } from './dto/update-maintenance.dto';
import { TimelineEventType } from '@hanbey-fleet/shared';

@Injectable()
export class MaintenanceService {
  constructor(
    private repo: MaintenanceRepository,
    private timeline: TimelineService,
  ) {}

  findAll(vehicleId?: string) {
    return this.repo.findAll(vehicleId);
  }

  async findOne(id: string) {
    const m = await this.repo.findById(id);
    if (!m) throw new NotFoundException(`Maintenance record ${id} not found`);
    return m;
  }

  async create(dto: CreateMaintenanceDto) {
    const record = await this.repo.create(dto);

    await this.timeline.create({
      vehicleId: dto.vehicleId,
      eventType: TimelineEventType.MAINTENANCE_COMPLETED,
      description: `Maintenance: ${dto.description} — ${dto.cost} TL`,
      metadata: {
        recordId: record.id,
        description: dto.description,
        cost: dto.cost,
        mileage: dto.mileage,
        serviceProvider: dto.serviceProvider,
      },
    });

    return record;
  }

  async update(id: string, dto: UpdateMaintenanceDto) {
    await this.findOne(id);
    return this.repo.update(id, dto);
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.repo.softDelete(id);
  }
}
