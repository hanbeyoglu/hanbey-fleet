import { Injectable } from '@nestjs/common';
import { ShiftStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDriverDto } from './dto/create-driver.dto';
import { UpdateDriverDto } from './dto/update-driver.dto';

const DRIVER_INCLUDE = {
  user: { select: { id: true, name: true, username: true, email: true, role: true, isActive: true } },
  shifts: {
    where: { status: ShiftStatus.ACTIVE, deletedAt: null },
    take: 1,
    include: { vehicle: { select: { id: true, plate: true, brand: true, model: true } } },
  },
};

@Injectable()
export class DriversRepository {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.driver.findMany({
      where: { deletedAt: null },
      include: DRIVER_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }

  findById(id: string) {
    return this.prisma.driver.findFirst({
      where: { id, deletedAt: null },
      include: DRIVER_INCLUDE,
    });
  }

  findByIdForShift(id: string) {
    return this.prisma.driver.findFirst({
      where: { id, deletedAt: null },
      include: { user: { select: { id: true, name: true, username: true, email: true, isActive: true } } },
    });
  }

  findByUserId(userId: string) {
    return this.prisma.driver.findUnique({ where: { userId } });
  }

  findByLicense(licenseNo: string) {
    return this.prisma.driver.findUnique({ where: { licenseNo } });
  }

  hasActiveShift(driverId: string) {
    return this.prisma.shift
      .count({
        where: { driverId, status: ShiftStatus.ACTIVE, deletedAt: null },
      })
      .then((count) => count > 0);
  }

  create(dto: CreateDriverDto) {
    return this.prisma.driver.create({ data: dto, include: DRIVER_INCLUDE });
  }

  update(id: string, dto: UpdateDriverDto) {
    return this.prisma.driver.update({ where: { id }, data: dto, include: DRIVER_INCLUDE });
  }

  softDelete(id: string) {
    return this.prisma.driver.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
