import { Injectable } from '@nestjs/common';
import { TimelineRepository } from './timeline.repository';
import { CreateTimelineEventDto } from './dto/create-timeline-event.dto';

@Injectable()
export class TimelineService {
  constructor(private repo: TimelineRepository) {}

  create(dto: CreateTimelineEventDto) {
    return this.repo.create(dto);
  }

  findByVehicle(vehicleId: string, limit?: number) {
    return this.repo.findByVehicle(vehicleId, limit);
  }

  findAll() {
    return this.repo.findAll();
  }
}
