import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { HgsListQueryDto } from './dto/hgs-list-query.dto';

const HGS_INCLUDE = {
  vehicle: { select: { id: true, plate: true, hgsTag: true } },
  shift: { select: { id: true, status: true } },
} satisfies Prisma.HgsTransitInclude;

export interface CreateHgsTransitData {
  vehicleId: string;
  shiftId?: string;
  transitTime: Date;
  tollBooth: string;
  amount: number;
  provider?: string;
  referenceNo: string;
  rawData?: Record<string, unknown>;
  syncedAt: Date;
}

@Injectable()
export class HgsRepository {
  constructor(private prisma: PrismaService) {}

  runInTransaction<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(fn);
  }

  findMany(query: HgsListQueryDto, fleetOwnerId?: string | null) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const sortBy = query.sortBy ?? 'transitTime';
    const sortOrder = query.sortOrder ?? 'desc';
    const where = this.buildWhereClause(query, fleetOwnerId);

    return Promise.all([
      this.prisma.hgsTransit.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: HGS_INCLUDE,
      }),
      this.prisma.hgsTransit.count({ where }),
    ]).then(([data, total]) => ({ data, total, page, limit }));
  }

  findById(id: string, fleetOwnerId?: string | null) {
    return this.prisma.hgsTransit.findFirst({
      where: {
        id,
        ...(fleetOwnerId && { vehicle: { fleetOwnerId, deletedAt: null } }),
      },
      include: HGS_INCLUDE,
    });
  }

  findByReferenceNo(referenceNo: string) {
    return this.prisma.hgsTransit.findUnique({
      where: { referenceNo },
      select: { id: true, referenceNo: true },
    });
  }

  findExistingReferenceNos(referenceNos: string[]) {
    return this.prisma.hgsTransit.findMany({
      where: { referenceNo: { in: referenceNos } },
      select: { referenceNo: true },
    });
  }

  create(data: CreateHgsTransitData, tx?: Prisma.TransactionClient) {
    const client = tx ?? this.prisma;
    return client.hgsTransit.create({
      data: {
        vehicleId: data.vehicleId,
        shiftId: data.shiftId,
        transitTime: data.transitTime,
        tollBooth: data.tollBooth,
        amount: data.amount,
        provider: data.provider,
        referenceNo: data.referenceNo,
        rawData: data.rawData as Prisma.InputJsonValue | undefined,
        syncedAt: data.syncedAt,
      },
      include: HGS_INCLUDE,
    });
  }

  monthlyTotal(vehicleId: string, year: number, month: number) {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 1);
    return this.prisma.hgsTransit.aggregate({
      where: { vehicleId, transitTime: { gte: start, lt: end } },
      _sum: { amount: true },
      _count: true,
    });
  }

  private buildWhereClause(
    query: HgsListQueryDto,
    fleetOwnerId?: string | null,
  ): Prisma.HgsTransitWhereInput {
    const where: Prisma.HgsTransitWhereInput = {};

    if (fleetOwnerId) {
      where.vehicle = { fleetOwnerId, deletedAt: null };
    }

    if (query.vehicleId) {
      where.vehicleId = query.vehicleId;
    }

    if (query.shiftId) {
      where.shiftId = query.shiftId;
    }

    if (query.provider) {
      where.provider = { equals: query.provider, mode: 'insensitive' };
    }

    if (query.startDate || query.endDate) {
      where.transitTime = {};
      if (query.startDate) {
        where.transitTime.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        where.transitTime.lte = new Date(query.endDate);
      }
    }

    if (query.search) {
      const term = query.search.trim();
      where.OR = [
        { tollBooth: { contains: term, mode: 'insensitive' } },
        { referenceNo: { contains: term, mode: 'insensitive' } },
        { provider: { contains: term, mode: 'insensitive' } },
      ];
    }

    return where;
  }
}
