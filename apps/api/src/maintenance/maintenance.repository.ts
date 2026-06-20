import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MaintenanceListQueryDto } from './dto/maintenance-list-query.dto';

const MAINTENANCE_INCLUDE = {
  vehicle: { select: { id: true, plate: true, brand: true, model: true } },
  expense: { select: { id: true, amount: true, expenseDate: true } },
} satisfies Prisma.MaintenanceRecordInclude;

export interface CreateMaintenanceData {
  vehicleId: string;
  expenseId?: string;
  description: string;
  cost: number;
  date: Date;
  mileage?: number;
  serviceProvider?: string;
  warrantyUntil?: Date;
  nextMaintenanceMileage?: number;
  notes?: string;
}

export interface UpdateMaintenanceData {
  expenseId?: string | null;
  description?: string;
  cost?: number;
  date?: Date;
  mileage?: number | null;
  serviceProvider?: string | null;
  warrantyUntil?: Date | null;
  nextMaintenanceMileage?: number | null;
  notes?: string | null;
}

@Injectable()
export class MaintenanceRepository {
  constructor(private prisma: PrismaService) {}

  findMany(query: MaintenanceListQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const sortBy = query.sortBy ?? 'date';
    const sortOrder = query.sortOrder ?? 'desc';
    const where = this.buildWhereClause(query);

    return Promise.all([
      this.prisma.maintenanceRecord.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: MAINTENANCE_INCLUDE,
      }),
      this.prisma.maintenanceRecord.count({ where }),
    ]).then(([data, total]) => ({ data, total, page, limit }));
  }

  findById(id: string) {
    return this.prisma.maintenanceRecord.findFirst({
      where: { id, deletedAt: null },
      include: MAINTENANCE_INCLUDE,
    });
  }

  findByExpenseId(expenseId: string, excludeId?: string) {
    return this.prisma.maintenanceRecord.findFirst({
      where: {
        expenseId,
        deletedAt: null,
        ...(excludeId && { id: { not: excludeId } }),
      },
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

  create(data: CreateMaintenanceData) {
    return this.prisma.maintenanceRecord.create({
      data: {
        vehicleId: data.vehicleId,
        expenseId: data.expenseId,
        description: data.description,
        cost: data.cost,
        date: data.date,
        mileage: data.mileage,
        serviceProvider: data.serviceProvider,
        warrantyUntil: data.warrantyUntil,
        nextMaintenanceMileage: data.nextMaintenanceMileage,
        notes: data.notes,
      },
      include: MAINTENANCE_INCLUDE,
    });
  }

  update(id: string, data: UpdateMaintenanceData) {
    return this.prisma.maintenanceRecord.update({
      where: { id },
      data: {
        ...(data.expenseId !== undefined && { expenseId: data.expenseId }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.cost !== undefined && { cost: data.cost }),
        ...(data.date !== undefined && { date: data.date }),
        ...(data.mileage !== undefined && { mileage: data.mileage }),
        ...(data.serviceProvider !== undefined && { serviceProvider: data.serviceProvider }),
        ...(data.warrantyUntil !== undefined && { warrantyUntil: data.warrantyUntil }),
        ...(data.nextMaintenanceMileage !== undefined && {
          nextMaintenanceMileage: data.nextMaintenanceMileage,
        }),
        ...(data.notes !== undefined && { notes: data.notes }),
      },
      include: MAINTENANCE_INCLUDE,
    });
  }

  softDelete(id: string) {
    return this.prisma.maintenanceRecord.update({
      where: { id },
      data: { deletedAt: new Date() },
      include: MAINTENANCE_INCLUDE,
    });
  }

  private buildWhereClause(query: MaintenanceListQueryDto): Prisma.MaintenanceRecordWhereInput {
    const where: Prisma.MaintenanceRecordWhereInput = { deletedAt: null };

    if (query.vehicleId) {
      where.vehicleId = query.vehicleId;
    }

    if (query.serviceProvider) {
      where.serviceProvider = { contains: query.serviceProvider, mode: 'insensitive' };
    }

    if (query.startDate || query.endDate) {
      where.date = {};
      if (query.startDate) {
        where.date.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        where.date.lte = new Date(query.endDate);
      }
    }

    if (query.search) {
      const term = query.search.trim();
      where.OR = [
        { description: { contains: term, mode: 'insensitive' } },
        { serviceProvider: { contains: term, mode: 'insensitive' } },
        { notes: { contains: term, mode: 'insensitive' } },
      ];
    }

    return where;
  }
}
