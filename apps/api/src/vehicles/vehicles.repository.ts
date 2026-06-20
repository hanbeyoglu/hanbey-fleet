import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';

@Injectable()
export class VehiclesRepository {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.vehicle.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  findAllActive() {
    return this.prisma.vehicle.findMany({
      where: { deletedAt: null },
      select: { id: true, plate: true, brand: true, model: true, year: true },
    });
  }

  findById(id: string) {
    return this.prisma.vehicle.findUnique({
      where: { id, deletedAt: null },
      include: {
        shifts: {
          where: { status: 'ACTIVE', deletedAt: null },
          include: { driver: { include: { user: { select: { name: true, email: true } } } } },
          take: 1,
        },
        timelineEvents: { orderBy: { eventTime: 'desc' }, take: 20 },
      },
    });
  }

  findByPlate(plate: string) {
    return this.prisma.vehicle.findUnique({ where: { plate } });
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
}
