import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDriverDto } from './dto/create-driver.dto';
import { UpdateDriverDto } from './dto/update-driver.dto';

const DRIVER_INCLUDE = {
  user: { select: { id: true, name: true, email: true, role: true } },
  assignments: {
    where: { isActive: true },
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
    return this.prisma.driver.findUnique({
      where: { id, deletedAt: null },
      include: DRIVER_INCLUDE,
    });
  }

  findByUserId(userId: string) {
    return this.prisma.driver.findUnique({ where: { userId } });
  }

  findByLicense(licenseNo: string) {
    return this.prisma.driver.findUnique({ where: { licenseNo } });
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
