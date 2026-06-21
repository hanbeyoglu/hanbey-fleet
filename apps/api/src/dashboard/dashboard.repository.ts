import { Injectable } from '@nestjs/common';
import { MembershipStatus, Prisma, ShiftStatus, VehicleStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface DateRange {
  start: Date;
  end: Date;
}

type DailyAggregateRow = { date: Date; value: Prisma.Decimal | null };

@Injectable()
export class DashboardRepository {
  constructor(private prisma: PrismaService) {}

  private vehicleFilter(fleetOwnerId?: string | null): Prisma.VehicleWhereInput {
    if (!fleetOwnerId) return { deletedAt: null };
    return { fleetOwnerId, deletedAt: null };
  }

  sumSettlementNetRevenue(range: DateRange, fleetOwnerId?: string | null) {
    return this.prisma.settlement.aggregate({
      where: {
        createdAt: { gte: range.start, lt: range.end },
        ...(fleetOwnerId && {
          shift: { vehicle: { fleetOwnerId, deletedAt: null } },
        }),
      },
      _sum: { netRevenue: true },
    });
  }

  sumExpenses(range: DateRange, fleetOwnerId?: string | null) {
    return this.prisma.expense.aggregate({
      where: {
        deletedAt: null,
        expenseDate: { gte: range.start, lt: range.end },
        ...(fleetOwnerId && { vehicle: { fleetOwnerId, deletedAt: null } }),
      },
      _sum: { amount: true },
    });
  }

  sumHgs(range: DateRange, fleetOwnerId?: string | null) {
    return this.prisma.hgsTransit.aggregate({
      where: {
        transitTime: { gte: range.start, lt: range.end },
        ...(fleetOwnerId && { vehicle: { fleetOwnerId, deletedAt: null } }),
      },
      _sum: { amount: true },
    });
  }

  countActiveVehicles(fleetOwnerId?: string | null) {
    return this.prisma.vehicle.count({
      where: { ...this.vehicleFilter(fleetOwnerId), status: VehicleStatus.ACTIVE_SHIFT },
    });
  }

  countActiveDrivers(fleetOwnerId?: string | null) {
    return this.prisma.shift.count({
      where: {
        deletedAt: null,
        status: ShiftStatus.ACTIVE,
        ...(fleetOwnerId && { vehicle: { fleetOwnerId, deletedAt: null } }),
      },
    });
  }

  countCompletedShifts(range: DateRange, fleetOwnerId?: string | null) {
    return this.prisma.shift.count({
      where: {
        deletedAt: null,
        status: ShiftStatus.COMPLETED,
        actualEnd: { gte: range.start, lt: range.end },
        ...(fleetOwnerId && { vehicle: { fleetOwnerId, deletedAt: null } }),
      },
    });
  }

  countMaintenance(range: DateRange, fleetOwnerId?: string | null) {
    return this.prisma.maintenanceRecord.count({
      where: {
        deletedAt: null,
        date: { gte: range.start, lt: range.end },
        ...(fleetOwnerId && { vehicle: { fleetOwnerId, deletedAt: null } }),
      },
    });
  }

  settlementCountsByStatus(fleetOwnerId?: string | null) {
    return this.prisma.settlement.groupBy({
      by: ['status'],
      where: fleetOwnerId
        ? { shift: { vehicle: { fleetOwnerId, deletedAt: null } } }
        : undefined,
      _count: true,
    });
  }

  // BR-128: Assignment statistics for dashboard
  countAssignedVehicles(fleetOwnerId?: string | null) {
    return this.prisma.vehicleAssignment.count({
      where: {
        releasedAt: null,
        ...(fleetOwnerId && { vehicle: { fleetOwnerId, deletedAt: null } }),
      },
    });
  }

  countTotalActiveVehicles(fleetOwnerId?: string | null) {
    return this.prisma.vehicle.count({ where: this.vehicleFilter(fleetOwnerId) });
  }

  countAssignedDrivers(fleetOwnerId?: string | null) {
    return this.countAssignedVehicles(fleetOwnerId);
  }

  countTotalDrivers(fleetOwnerId?: string | null) {
    if (!fleetOwnerId) {
      return this.prisma.driver.count({ where: { deletedAt: null } });
    }

    return this.prisma.driver.count({
      where: {
        deletedAt: null,
        user: {
          fleetMemberships: {
            some: { fleetOwnerId, status: MembershipStatus.ACTIVE },
          },
        },
      },
    });
  }

  revenueByDay(range: DateRange, fleetOwnerId?: string | null) {
    if (!fleetOwnerId) {
      return this.prisma.$queryRaw<DailyAggregateRow[]>`
        SELECT DATE("createdAt") AS date, SUM("netRevenue") AS value
        FROM settlements
        WHERE "createdAt" >= ${range.start} AND "createdAt" < ${range.end}
        GROUP BY DATE("createdAt")
        ORDER BY date ASC
      `;
    }

    return this.prisma.$queryRaw<DailyAggregateRow[]>`
      SELECT DATE(s."createdAt") AS date, SUM(s."netRevenue") AS value
      FROM settlements s
      JOIN shifts sh ON sh.id = s."shiftId"
      JOIN vehicles v ON v.id = sh."vehicleId"
      WHERE s."createdAt" >= ${range.start}
        AND s."createdAt" < ${range.end}
        AND v."fleetOwnerId" = ${fleetOwnerId}
        AND v."deletedAt" IS NULL
      GROUP BY DATE(s."createdAt")
      ORDER BY date ASC
    `;
  }

  expensesByDay(range: DateRange, fleetOwnerId?: string | null) {
    if (!fleetOwnerId) {
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

    return this.prisma.$queryRaw<DailyAggregateRow[]>`
      SELECT DATE(e."expenseDate") AS date, SUM(e.amount) AS value
      FROM expenses e
      JOIN vehicles v ON v.id = e."vehicleId"
      WHERE e."deletedAt" IS NULL
        AND e."expenseDate" >= ${range.start}
        AND e."expenseDate" < ${range.end}
        AND v."fleetOwnerId" = ${fleetOwnerId}
        AND v."deletedAt" IS NULL
      GROUP BY DATE(e."expenseDate")
      ORDER BY date ASC
    `;
  }

  hgsByDay(range: DateRange, fleetOwnerId?: string | null) {
    if (!fleetOwnerId) {
      return this.prisma.$queryRaw<DailyAggregateRow[]>`
        SELECT DATE("transitTime") AS date, SUM(amount) AS value
        FROM hgs_transits
        WHERE "transitTime" >= ${range.start} AND "transitTime" < ${range.end}
        GROUP BY DATE("transitTime")
        ORDER BY date ASC
      `;
    }

    return this.prisma.$queryRaw<DailyAggregateRow[]>`
      SELECT DATE(h."transitTime") AS date, SUM(h.amount) AS value
      FROM hgs_transits h
      JOIN vehicles v ON v.id = h."vehicleId"
      WHERE h."transitTime" >= ${range.start}
        AND h."transitTime" < ${range.end}
        AND v."fleetOwnerId" = ${fleetOwnerId}
        AND v."deletedAt" IS NULL
      GROUP BY DATE(h."transitTime")
      ORDER BY date ASC
    `;
  }
}
