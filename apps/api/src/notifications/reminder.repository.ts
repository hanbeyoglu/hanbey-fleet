import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ShiftStatus, SettlementStatus } from '@hanbey-fleet/shared';

@Injectable()
export class ReminderRepository {
  constructor(private prisma: PrismaService) {}

  findMaintenanceCandidates() {
    return this.prisma.maintenanceRecord.findMany({
      where: {
        deletedAt: null,
        nextMaintenanceMileage: { not: null },
        vehicle: { deletedAt: null },
      },
      include: {
        vehicle: { select: { id: true, plate: true, currentMileage: true } },
      },
    });
  }

  findWarrantyExpiring(withinDays: number) {
    const now = new Date();
    const deadline = new Date(now);
    deadline.setDate(deadline.getDate() + withinDays);

    return this.prisma.maintenanceRecord.findMany({
      where: {
        deletedAt: null,
        warrantyUntil: { gte: now, lte: deadline },
        vehicle: { deletedAt: null },
      },
      include: {
        vehicle: { select: { id: true, plate: true } },
      },
    });
  }

  findCompletedShiftsMissingReport(olderThan: Date) {
    return this.prisma.shift.findMany({
      where: {
        deletedAt: null,
        status: ShiftStatus.COMPLETED,
        actualEnd: { lte: olderThan },
        driverReport: null,
      },
      include: {
        vehicle: { select: { id: true, plate: true } },
        driver: { select: { id: true, user: { select: { name: true } } } },
      },
    });
  }

  findMismatchSettlements() {
    return this.prisma.settlement.findMany({
      where: { status: SettlementStatus.MISMATCH },
      include: {
        shift: {
          select: {
            id: true,
            vehicleId: true,
            vehicle: { select: { plate: true } },
          },
        },
      },
    });
  }
}
