import { Injectable } from '@nestjs/common';
import { Prisma, ShiftStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { VehicleListQueryDto } from './dto/vehicle-list-query.dto';

const ACTIVE_SHIFT_INCLUDE = {
  shifts: {
    where: { status: ShiftStatus.ACTIVE, deletedAt: null },
    include: { driver: { include: { user: { select: { name: true, username: true, email: true } } } } },
    take: 1,
  },
  timelineEvents: { orderBy: { eventTime: 'desc' as const }, take: 20 },
} satisfies Prisma.VehicleInclude;

@Injectable()
export class VehiclesRepository {
  constructor(private prisma: PrismaService) {}

  findMany(query: VehicleListQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const sortBy = query.sortBy ?? 'createdAt';
    const sortOrder = query.sortOrder ?? 'desc';
    const where = this.buildWhereClause(query);

    return Promise.all([
      this.prisma.vehicle.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.vehicle.count({ where }),
    ]).then(([data, total]) => ({ data, total, page, limit }));
  }

  findAllActive() {
    return this.prisma.vehicle.findMany({
      where: { deletedAt: null },
      select: { id: true, plate: true, brand: true, model: true, year: true, hgsTag: true },
    });
  }

  findAllActivePlates() {
    return this.prisma.vehicle.findMany({
      where: { deletedAt: null },
      select: { id: true, plate: true },
    });
  }

  findById(id: string) {
    return this.prisma.vehicle.findFirst({
      where: { id, deletedAt: null },
      include: ACTIVE_SHIFT_INCLUDE,
    });
  }

  findActiveByPlate(plate: string) {
    return this.prisma.vehicle.findFirst({
      where: { plate, deletedAt: null },
    });
  }

  findByIdForShift(id: string) {
    return this.prisma.vehicle.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, plate: true, status: true, currentMileage: true, deletedAt: true },
    });
  }

  updateOperationalState(
    id: string,
    data: { status?: Prisma.VehicleUpdateInput['status']; currentMileage?: number },
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? this.prisma;
    return client.vehicle.update({
      where: { id },
      data,
    });
  }

  hasActiveShift(vehicleId: string) {
    return this.prisma.shift
      .count({
        where: { vehicleId, status: ShiftStatus.ACTIVE, deletedAt: null },
      })
      .then((count) => count > 0);
  }

  create(dto: CreateVehicleDto) {
    return this.prisma.vehicle.create({ data: dto });
  }

  update(id: string, dto: UpdateVehicleDto) {
    return this.prisma.vehicle.update({ where: { id }, data: dto });
  }

  softDelete(id: string) {
    return this.prisma.vehicle.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  private buildWhereClause(query: VehicleListQueryDto): Prisma.VehicleWhereInput {
    const where: Prisma.VehicleWhereInput = { deletedAt: null };

    if (query.status) {
      where.status = query.status;
    }

    if (query.search) {
      const term = query.search.trim();
      where.OR = [
        { plate: { contains: term, mode: 'insensitive' } },
        { brand: { contains: term, mode: 'insensitive' } },
        { model: { contains: term, mode: 'insensitive' } },
      ];
    }

    return where;
  }
}
