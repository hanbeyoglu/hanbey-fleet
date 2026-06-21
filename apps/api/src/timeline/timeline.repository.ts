import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTimelineEventDto } from './dto/create-timeline-event.dto';

@Injectable()
export class TimelineRepository {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateTimelineEventDto, tx?: Prisma.TransactionClient) {
    const client = tx ?? this.prisma;
    return client.timelineEvent.create({
      data: {
        vehicleId: dto.vehicleId,
        shiftId: dto.shiftId,
        eventType: dto.eventType,
        description: dto.description,
        metadata: dto.metadata as Prisma.InputJsonValue | undefined,
      },
    });
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

  findRecent(limit: number) {
    return this.prisma.timelineEvent.findMany({
      orderBy: { eventTime: 'desc' },
      take: limit,
      include: { vehicle: { select: { id: true, plate: true } } },
    });
  }
}
