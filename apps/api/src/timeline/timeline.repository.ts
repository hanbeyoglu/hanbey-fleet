import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTimelineEventDto } from './dto/create-timeline-event.dto';

@Injectable()
export class TimelineRepository {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateTimelineEventDto) {
    return this.prisma.timelineEvent.create({ data: dto });
  }

  findByVehicle(vehicleId: string, limit = 50) {
    return this.prisma.timelineEvent.findMany({
      where: { vehicleId },
      orderBy: { eventTime: 'desc' },
      take: limit,
    });
  }

  findAll() {
    return this.prisma.timelineEvent.findMany({
      orderBy: { eventTime: 'desc' },
      include: { vehicle: { select: { id: true, plate: true } } },
    });
  }
}
