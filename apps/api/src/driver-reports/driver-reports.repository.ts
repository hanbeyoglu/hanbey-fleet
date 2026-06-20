import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { DriverReportSource } from '@hanbey-fleet/shared';

const DRIVER_REPORT_INCLUDE = {
  approvedBy: { select: { id: true, name: true, username: true, email: true } },
  shift: {
    select: {
      id: true,
      vehicleId: true,
      driverId: true,
      vehicle: { select: { plate: true } },
    },
  },
} satisfies Prisma.DriverReportInclude;

export type DriverReportCreateData = {
  shiftId: string;
  source: DriverReportSource;
  rawMessage?: string;
  declaredRevenue: number;
  declaredHgs: number;
  declaredTotal: number;
  notes?: string;
  cashRevenue?: number;
  cardRevenue?: number;
  posRevenue?: number;
  tips?: number;
  cashDelivered?: number;
};

@Injectable()
export class DriverReportsRepository {
  constructor(private prisma: PrismaService) {}

  runInTransaction<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(fn);
  }

  create(data: DriverReportCreateData, tx?: Prisma.TransactionClient) {
    const client = tx ?? this.prisma;
    return client.driverReport.create({
      data: {
        shiftId: data.shiftId,
        source: data.source,
        rawMessage: data.rawMessage,
        declaredRevenue: data.declaredRevenue,
        declaredHgs: data.declaredHgs,
        declaredTotal: data.declaredTotal,
        notes: data.notes,
        cashRevenue: data.cashRevenue,
        cardRevenue: data.cardRevenue,
        posRevenue: data.posRevenue,
        tips: data.tips,
        cashDelivered: data.cashDelivered,
      },
      include: DRIVER_REPORT_INCLUDE,
    });
  }

  findById(id: string) {
    return this.prisma.driverReport.findUnique({
      where: { id },
      include: DRIVER_REPORT_INCLUDE,
    });
  }

  findByShiftId(shiftId: string) {
    return this.prisma.driverReport.findUnique({
      where: { shiftId },
      include: DRIVER_REPORT_INCLUDE,
    });
  }

  approve(id: string, approvedById: string, tx?: Prisma.TransactionClient) {
    const client = tx ?? this.prisma;
    return client.driverReport.update({
      where: { id },
      data: {
        isApproved: true,
        approvedById,
        approvedAt: new Date(),
      },
      include: DRIVER_REPORT_INCLUDE,
    });
  }
}
