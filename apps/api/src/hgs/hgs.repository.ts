import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface HgsTransitData {
  vehicleId: string;
  shiftId?: string;
  transitTime: Date;
  tollBooth: string;
  amount: number;
  provider?: string;
  referenceNo?: string;
  rawData?: Record<string, unknown>;
}

@Injectable()
export class HgsRepository {
  constructor(private prisma: PrismaService) {}

  findAll(vehicleId?: string) {
    return this.prisma.hgsTransit.findMany({
      where: vehicleId ? { vehicleId } : undefined,
      include: { vehicle: { select: { id: true, plate: true, hgsTag: true } } },
      orderBy: { transitTime: 'desc' },
    });
  }

  findById(id: string) {
    return this.prisma.hgsTransit.findUnique({
      where: { id },
      include: { vehicle: { select: { id: true, plate: true, hgsTag: true } } },
    });
  }

  createMany(records: HgsTransitData[]) {
    return this.prisma.hgsTransit.createMany({
      data: records.map((r) => ({
        vehicleId: r.vehicleId,
        shiftId: r.shiftId,
        transitTime: r.transitTime,
        tollBooth: r.tollBooth,
        amount: r.amount,
        provider: r.provider,
        referenceNo: r.referenceNo,
        rawData: r.rawData,
        syncedAt: new Date(),
      })),
      skipDuplicates: true,
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
}
