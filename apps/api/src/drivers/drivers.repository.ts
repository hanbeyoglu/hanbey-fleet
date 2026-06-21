import { Injectable } from '@nestjs/common';
import { MembershipStatus, ShiftStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDriverDto } from './dto/create-driver.dto';
import { UpdateDriverDto } from './dto/update-driver.dto';

const DRIVER_INCLUDE = {
  user: { select: { id: true, name: true, username: true, email: true, phone: true, role: true, isActive: true } },
  shifts: {
    where: { status: ShiftStatus.ACTIVE, deletedAt: null },
    take: 1,
    include: { vehicle: { select: { id: true, plate: true, brand: true, model: true } } },
  },
};

@Injectable()
export class DriversRepository {
  constructor(private prisma: PrismaService) {}

  private fleetMembershipFilter(fleetOwnerId?: string | null) {
    if (!fleetOwnerId) return {};
    return {
      user: {
        fleetMemberships: {
          some: { fleetOwnerId, status: MembershipStatus.ACTIVE },
        },
      },
    };
  }

  findAll(fleetOwnerId?: string | null) {
    return this.prisma.driver.findMany({
      where: { deletedAt: null, ...this.fleetMembershipFilter(fleetOwnerId) },
      include: DRIVER_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }

  findById(id: string, fleetOwnerId?: string | null) {
    return this.prisma.driver.findFirst({
      where: { id, deletedAt: null, ...this.fleetMembershipFilter(fleetOwnerId) },
      include: DRIVER_INCLUDE,
    });
  }

  findByIdForShift(id: string, fleetOwnerId?: string | null) {
    return this.prisma.driver.findFirst({
      where: { id, deletedAt: null, ...this.fleetMembershipFilter(fleetOwnerId) },
      include: { user: { select: { id: true, name: true, username: true, email: true, isActive: true } } },
    });
  }

  findByUserId(userId: string) {
    return this.prisma.driver.findUnique({ where: { userId } });
  }

  findByLicense(licenseNo: string) {
    return this.prisma.driver.findUnique({ where: { licenseNo } });
  }

  // BR-154: Search by phone to prevent duplicate accounts
  findByPhone(phone: string, fleetOwnerId?: string | null) {
    return this.prisma.driver.findFirst({
      where: { phone, deletedAt: null, ...this.fleetMembershipFilter(fleetOwnerId) },
      include: DRIVER_INCLUDE,
    });
  }

  // BR-153: Search by user phone (globally unique)
  findByUserPhone(phone: string, fleetOwnerId?: string | null) {
    return this.prisma.driver.findFirst({
      where: { user: { phone }, deletedAt: null, ...this.fleetMembershipFilter(fleetOwnerId) },
      include: DRIVER_INCLUDE,
    });
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
