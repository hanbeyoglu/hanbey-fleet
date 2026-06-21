import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTimelineEventDto } from './dto/create-timeline-event.dto';

@Injectable()
export class TimelineRepository {
  constructor(private prisma: PrismaService) {}

  private vehicleFleetFilter(fleetOwnerId?: string | null): Prisma.TimelineEventWhereInput {
    if (!fleetOwnerId) return {};
    return { vehicle: { fleetOwnerId, deletedAt: null } };
  }

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

  findByVehicle(vehicleId: string, limit = 50, fleetOwnerId?: string | null) {
    return this.prisma.timelineEvent.findMany({
      where: { vehicleId, ...this.vehicleFleetFilter(fleetOwnerId) },
      orderBy: { eventTime: 'desc' },
      take: limit,
    });
  }

  findAll(fleetOwnerId?: string | null) {
    return this.prisma.timelineEvent.findMany({
      where: this.vehicleFleetFilter(fleetOwnerId),
      orderBy: { eventTime: 'desc' },
      include: { vehicle: { select: { id: true, plate: true } } },
    });
  }

  findRecent(limit: number, fleetOwnerId?: string | null) {
    return this.prisma.timelineEvent.findMany({
      where: this.vehicleFleetFilter(fleetOwnerId),
      orderBy: { eventTime: 'desc' },
      take: limit,
      include: { vehicle: { select: { id: true, plate: true } } },
    });
  }
}
