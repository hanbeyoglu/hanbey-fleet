import { Injectable } from '@nestjs/common';
import { Prisma, ShiftStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ShiftHistoryQueryDto } from './dto/shift-history-query.dto';
import { ShiftCurrentQueryDto } from './dto/shift-current-query.dto';

const SHIFT_INCLUDE = {
  vehicle: { select: { id: true, plate: true, brand: true, model: true } },
  driver: { include: { user: { select: { name: true, username: true, email: true } } } },
} satisfies Prisma.ShiftInclude;

export type ShiftCreateData = {
  vehicleId: string;
  driverId: string;
  plannedStart: Date;
  plannedEnd: Date;
  actualStart: Date;
  status: ShiftStatus;
  type: Prisma.ShiftCreateInput['type'];
  openingMileage: number;
  notes?: string;
};

export type ShiftUpdateData = {
  status?: ShiftStatus;
  actualEnd?: Date;
  closingMileage?: number;
  cancelReason?: string;
  notes?: string;
};

@Injectable()
export class ShiftsRepository {
  constructor(private prisma: PrismaService) {}

  runInTransaction<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(fn);
  }

  create(data: ShiftCreateData, tx?: Prisma.TransactionClient) {
    const client = tx ?? this.prisma;
    return client.shift.create({
      data: {
        vehicleId: data.vehicleId,
        driverId: data.driverId,
        plannedStart: data.plannedStart,
        plannedEnd: data.plannedEnd,
        actualStart: data.actualStart,
        status: data.status,
        type: data.type,
        openingMileage: data.openingMileage,
        notes: data.notes,
      },
      include: SHIFT_INCLUDE,
    });
  }

  findById(id: string) {
    return this.prisma.shift.findFirst({
      where: { id, deletedAt: null },
      include: SHIFT_INCLUDE,
    });
  }

  findCompletedById(id: string) {
    return this.prisma.shift.findFirst({
      where: { id, deletedAt: null, status: ShiftStatus.COMPLETED },
      include: {
        ...SHIFT_INCLUDE,
        driverReport: { select: { id: true } },
      },
    });
  }

  findActiveByVehicle(vehicleId: string) {
    return this.prisma.shift.findFirst({
      where: { vehicleId, status: ShiftStatus.ACTIVE, deletedAt: null },
      include: SHIFT_INCLUDE,
    });
  }

  findMatchingShiftForTransit(vehicleId: string, transitTime: Date) {
    return this.prisma.shift
      .findFirst({
        where: { vehicleId, status: ShiftStatus.ACTIVE, deletedAt: null },
        include: SHIFT_INCLUDE,
      })
      .then(async (active) => {
        if (active?.actualStart && transitTime >= active.actualStart) {
          return active;
        }

        return this.prisma.shift.findFirst({
          where: {
            vehicleId,
            status: ShiftStatus.COMPLETED,
            deletedAt: null,
            actualStart: { not: null, lte: transitTime },
            actualEnd: { not: null, gte: transitTime },
          },
          orderBy: { actualStart: 'desc' },
          include: SHIFT_INCLUDE,
        });
      });
  }

  findActiveByDriver(driverId: string) {
    return this.prisma.shift.findFirst({
      where: { driverId, status: ShiftStatus.ACTIVE, deletedAt: null },
      include: SHIFT_INCLUDE,
    });
  }

  findCurrent(filters: ShiftCurrentQueryDto) {
    return this.prisma.shift.findMany({
      where: {
        status: ShiftStatus.ACTIVE,
        deletedAt: null,
        ...(filters.vehicleId && { vehicleId: filters.vehicleId }),
        ...(filters.driverId && { driverId: filters.driverId }),
      },
      include: SHIFT_INCLUDE,
      orderBy: { actualStart: 'desc' },
    });
  }

  findHistory(query: ShiftHistoryQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const sortBy = query.sortBy ?? 'actualStart';
    const sortOrder = query.sortOrder ?? 'desc';
    const where = this.buildHistoryWhere(query);

    return Promise.all([
      this.prisma.shift.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: SHIFT_INCLUDE,
      }),
      this.prisma.shift.count({ where }),
    ]).then(([data, total]) => ({ data, total, page, limit }));
  }

  update(id: string, data: ShiftUpdateData, tx?: Prisma.TransactionClient) {
    const client = tx ?? this.prisma;
    return client.shift.update({
      where: { id },
      data,
      include: SHIFT_INCLUDE,
    });
  }

  private buildHistoryWhere(query: ShiftHistoryQueryDto): Prisma.ShiftWhereInput {
    const where: Prisma.ShiftWhereInput = { deletedAt: null };

    if (query.vehicleId) where.vehicleId = query.vehicleId;
    if (query.driverId) where.driverId = query.driverId;
    if (query.status) where.status = query.status as ShiftStatus;

    return where;
  }
}
