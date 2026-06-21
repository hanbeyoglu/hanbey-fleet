import { Injectable } from '@nestjs/common';
import { Prisma, SettlementStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SettlementListQueryDto } from './dto/settlement-list-query.dto';

const SETTLEMENT_INCLUDE = {
  shift: {
    include: {
      vehicle: {
        select: { id: true, plate: true, brand: true, model: true, fleetOwnerId: true },
      },
      driver: { include: { user: { select: { id: true, name: true, username: true } } } },
    },
  },
  approvedBy: { select: { id: true, name: true, username: true } },
} satisfies Prisma.SettlementInclude;

export interface CreateSettlementData {
  shiftId: string;
  driverReportId: string;
  declaredRevenue: number;
  declaredHgs: number;
  actualHgs: number;
  expenses: number;
  difference: number;
  netRevenue: number;
  status: SettlementStatus;
}

@Injectable()
export class SettlementsRepository {
  constructor(private prisma: PrismaService) {}

  runInTransaction<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(fn);
  }

  findMany(query: SettlementListQueryDto, fleetOwnerId?: string | null) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const sortBy = query.sortBy ?? 'createdAt';
    const sortOrder = query.sortOrder ?? 'desc';
    const where = this.buildWhereClause(query, fleetOwnerId);

    return Promise.all([
      this.prisma.settlement.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: SETTLEMENT_INCLUDE,
      }),
      this.prisma.settlement.count({ where }),
    ]).then(([data, total]) => ({ data, total, page, limit }));
  }

  findById(id: string, fleetOwnerId?: string | null) {
    return this.prisma.settlement.findFirst({
      where: {
        id,
        ...(fleetOwnerId && {
          shift: { vehicle: { fleetOwnerId, deletedAt: null } },
        }),
      },
      include: SETTLEMENT_INCLUDE,
    });
  }

  findByShiftId(shiftId: string, fleetOwnerId?: string | null) {
    return this.prisma.settlement.findFirst({
      where: {
        shiftId,
        ...(fleetOwnerId && {
          shift: { vehicle: { fleetOwnerId, deletedAt: null } },
        }),
      },
      include: SETTLEMENT_INCLUDE,
    });
  }

  create(data: CreateSettlementData, tx?: Prisma.TransactionClient) {
    const client = tx ?? this.prisma;
    return client.settlement.create({
      data: {
        shiftId: data.shiftId,
        driverReportId: data.driverReportId,
        declaredRevenue: data.declaredRevenue,
        declaredHgs: data.declaredHgs,
        actualHgs: data.actualHgs,
        expenses: data.expenses,
        difference: data.difference,
        netRevenue: data.netRevenue,
        status: data.status,
      },
      include: SETTLEMENT_INCLUDE,
    });
  }

  approve(id: string, approvedById: string, tx?: Prisma.TransactionClient) {
    const client = tx ?? this.prisma;
    return client.settlement.update({
      where: { id },
      data: {
        status: SettlementStatus.APPROVED,
        approvedById,
        approvedAt: new Date(),
      },
      include: SETTLEMENT_INCLUDE,
    });
  }

  calculateActualHgs(shiftId: string, tx?: Prisma.TransactionClient) {
    const client = tx ?? this.prisma;
    return client.hgsTransit.aggregate({
      where: { shiftId },
      _sum: { amount: true },
    });
  }

  calculateExpenses(shiftId: string, tx?: Prisma.TransactionClient) {
    const client = tx ?? this.prisma;
    return client.expense.aggregate({
      where: { shiftId, deletedAt: null },
      _sum: { amount: true },
    });
  }

  private buildWhereClause(
    query: SettlementListQueryDto,
    fleetOwnerId?: string | null,
  ): Prisma.SettlementWhereInput {
    const where: Prisma.SettlementWhereInput = {};

    if (query.status) {
      where.status = query.status;
    }

    if (fleetOwnerId || query.driverId || query.vehicleId || query.startDate || query.endDate) {
      where.shift = {};

      if (fleetOwnerId) {
        where.shift.vehicle = { fleetOwnerId, deletedAt: null };
      }

      if (query.driverId) {
        where.shift.driverId = query.driverId;
      }

      if (query.vehicleId) {
        where.shift.vehicleId = query.vehicleId;
      }

      if (query.startDate || query.endDate) {
        where.shift.actualEnd = {};
        if (query.startDate) {
          where.shift.actualEnd.gte = new Date(query.startDate);
        }
        if (query.endDate) {
          where.shift.actualEnd.lte = new Date(query.endDate);
        }
      }
    }

    return where;
  }
}
