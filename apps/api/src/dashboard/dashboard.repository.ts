import { Injectable } from '@nestjs/common';
import { Prisma, ShiftStatus, VehicleStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface DateRange {
  start: Date;
  end: Date;
}

type DailyAggregateRow = { date: Date; value: Prisma.Decimal | null };

@Injectable()
export class DashboardRepository {
  constructor(private prisma: PrismaService) {}

  sumSettlementNetRevenue(range: DateRange) {
    return this.prisma.settlement.aggregate({
      where: { createdAt: { gte: range.start, lt: range.end } },
      _sum: { netRevenue: true },
    });
  }

  sumExpenses(range: DateRange) {
    return this.prisma.expense.aggregate({
      where: {
        deletedAt: null,
        expenseDate: { gte: range.start, lt: range.end },
      },
      _sum: { amount: true },
    });
  }

  sumHgs(range: DateRange) {
    return this.prisma.hgsTransit.aggregate({
      where: {
        transitTime: { gte: range.start, lt: range.end },
      },
      _sum: { amount: true },
    });
  }

  countActiveVehicles() {
    return this.prisma.vehicle.count({
      where: { deletedAt: null, status: VehicleStatus.ACTIVE_SHIFT },
    });
  }

  countActiveDrivers() {
    return this.prisma.shift.count({
      where: { deletedAt: null, status: ShiftStatus.ACTIVE },
    });
  }

  countCompletedShifts(range: DateRange) {
    return this.prisma.shift.count({
      where: {
        deletedAt: null,
        status: ShiftStatus.COMPLETED,
        actualEnd: { gte: range.start, lt: range.end },
      },
    });
  }

  countMaintenance(range: DateRange) {
    return this.prisma.maintenanceRecord.count({
      where: {
        deletedAt: null,
        date: { gte: range.start, lt: range.end },
      },
    });
  }

  settlementCountsByStatus() {
    return this.prisma.settlement.groupBy({
      by: ['status'],
      _count: true,
    });
  }

  revenueByDay(range: DateRange) {
    return this.prisma.$queryRaw<DailyAggregateRow[]>`
      SELECT DATE("createdAt") AS date, SUM("netRevenue") AS value
      FROM settlements
      WHERE "createdAt" >= ${range.start} AND "createdAt" < ${range.end}
      GROUP BY DATE("createdAt")
      ORDER BY date ASC
    `;
  }

  expensesByDay(range: DateRange) {
    return this.prisma.$queryRaw<DailyAggregateRow[]>`
      SELECT DATE("expenseDate") AS date, SUM(amount) AS value
      FROM expenses
      WHERE "deletedAt" IS NULL
        AND "expenseDate" >= ${range.start}
        AND "expenseDate" < ${range.end}
      GROUP BY DATE("expenseDate")
      ORDER BY date ASC
    `;
  }

  hgsByDay(range: DateRange) {
    return this.prisma.$queryRaw<DailyAggregateRow[]>`
      SELECT DATE("transitTime") AS date, SUM(amount) AS value
      FROM hgs_transits
      WHERE "transitTime" >= ${range.start} AND "transitTime" < ${range.end}
      GROUP BY DATE("transitTime")
      ORDER BY date ASC
    `;
  }
}
