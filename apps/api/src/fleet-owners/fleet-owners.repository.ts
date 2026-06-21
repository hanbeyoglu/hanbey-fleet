import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFleetOwnerDto } from './dto/create-fleet-owner.dto';
import { UpdateFleetOwnerDto } from './dto/update-fleet-owner.dto';

const FLEET_OWNER_WITH_COUNTS = {
  id: true,
  name: true,
  phone: true,
  email: true,
  address: true,
  taxNumber: true,
  createdAt: true,
  updatedAt: true,
  _count: {
    select: {
      vehicles: { where: { deletedAt: null } },
      memberships: { where: { status: 'ACTIVE' as const } },
    },
  },
} as const;

@Injectable()
export class FleetOwnersRepository {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.fleetOwner.findMany({
      where: { deletedAt: null },
      select: FLEET_OWNER_WITH_COUNTS,
      orderBy: { name: 'asc' },
    });
  }

  findById(id: string) {
    return this.prisma.fleetOwner.findFirst({
      where: { id, deletedAt: null },
      select: FLEET_OWNER_WITH_COUNTS,
    });
  }

  findByPhone(phone: string) {
    return this.prisma.fleetOwner.findFirst({
      where: { phone, deletedAt: null },
      select: FLEET_OWNER_WITH_COUNTS,
    });
  }

  create(data: CreateFleetOwnerDto) {
    return this.prisma.fleetOwner.create({
      data: {
        name: data.name,
        phone: data.phone,
        email: data.email,
        address: data.address,
        taxNumber: data.taxNumber,
      },
      select: FLEET_OWNER_WITH_COUNTS,
    });
  }

  update(id: string, data: UpdateFleetOwnerDto) {
    return this.prisma.fleetOwner.update({
      where: { id },
      data: {
        name: data.name,
        phone: data.phone,
        email: data.email,
        address: data.address,
        taxNumber: data.taxNumber,
      },
      select: FLEET_OWNER_WITH_COUNTS,
    });
  }

  softDelete(id: string) {
    return this.prisma.fleetOwner.update({
      where: { id },
      data: { deletedAt: new Date() },
      select: FLEET_OWNER_WITH_COUNTS,
    });
  }

  findByUserMemberships(userId: string) {
    return this.prisma.fleetOwner.findMany({
      where: {
        deletedAt: null,
        memberships: { some: { userId, status: 'ACTIVE' } },
      },
      select: FLEET_OWNER_WITH_COUNTS,
      orderBy: { name: 'asc' },
    });
  }

  findMemberships(fleetOwnerId: string) {
    return this.prisma.fleetMembership.findMany({
      where: { fleetOwnerId, status: 'ACTIVE' },
      include: {
        user: {
          select: { id: true, name: true, username: true, email: true, phone: true, role: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  findMembershipsByUser(userId: string) {
    return this.prisma.fleetMembership.findMany({
      where: { userId, status: 'ACTIVE' },
      include: {
        fleetOwner: {
          select: { id: true, name: true, phone: true, email: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  findMembership(fleetOwnerId: string, userId: string) {
    return this.prisma.fleetMembership.findUnique({
      where: { fleetOwnerId_userId: { fleetOwnerId, userId } },
    });
  }

  createMembership(data: { fleetOwnerId: string; userId: string; role: string }) {
    return this.prisma.fleetMembership.create({
      data: {
        fleetOwnerId: data.fleetOwnerId,
        userId: data.userId,
        role: data.role as any,
        status: 'ACTIVE',
      },
      include: {
        fleetOwner: { select: { id: true, name: true, phone: true, email: true } },
      },
    });
  }

  updateMembershipStatus(id: string, status: 'ACTIVE' | 'INACTIVE') {
    return this.prisma.fleetMembership.update({
      where: { id },
      data: { status },
    });
  }
}
