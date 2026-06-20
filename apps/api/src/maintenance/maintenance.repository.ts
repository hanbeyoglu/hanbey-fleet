import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMaintenanceDto } from './dto/create-maintenance.dto';
import { UpdateMaintenanceDto } from './dto/update-maintenance.dto';

@Injectable()
export class MaintenanceRepository {
  constructor(private prisma: PrismaService) {}

  findAll(vehicleId?: string) {
    return this.prisma.maintenanceRecord.findMany({
      where: { deletedAt: null, ...(vehicleId && { vehicleId }) },
      include: { vehicle: { select: { id: true, plate: true, brand: true, model: true } } },
      orderBy: { date: 'desc' },
    });
  }

  findById(id: string) {
    return this.prisma.maintenanceRecord.findUnique({
      where: { id, deletedAt: null },
      include: { vehicle: { select: { id: true, plate: true, brand: true, model: true } } },
    });
  }

  findByVehicleAndPeriod(vehicleId: string, start: Date, end: Date) {
    return this.prisma.maintenanceRecord.findMany({
      where: {
        vehicleId,
        deletedAt: null,
        date: { gte: start, lt: end },
      },
      select: { description: true, cost: true, date: true, serviceProvider: true },
    });
  }

  create(dto: CreateMaintenanceDto) {
    return this.prisma.maintenanceRecord.create({
      data: { ...dto, date: new Date(dto.date) },
    });
  }

  update(id: string, dto: UpdateMaintenanceDto) {
    return this.prisma.maintenanceRecord.update({
      where: { id },
      data: { ...dto, date: dto.date ? new Date(dto.date) : undefined },
    });
  }

  softDelete(id: string) {
    return this.prisma.maintenanceRecord.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
