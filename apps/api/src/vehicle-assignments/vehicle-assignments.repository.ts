import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AssignmentListQueryDto } from './dto/assignment-list-query.dto';
import { AssignmentStatus } from '@hanbey-fleet/shared';

const ASSIGNMENT_INCLUDE = {
  vehicle: {
    select: {
      id: true,
      plate: true,
      brand: true,
      model: true,
      currentMileage: true,
      dailyFee: true,
    },
  },
  driver: { include: { user: { select: { name: true, username: true } } } },
  assignedBy: { select: { id: true, name: true, username: true } },
} satisfies Prisma.VehicleAssignmentInclude;

export type AssignmentCreateData = {
  vehicleId: string;
  driverId: string;
  assignedById: string;
  notes?: string;
};

export type AssignmentReleaseData = {
  releasedAt: Date;
  releaseReason?: string;
};

@Injectable()
export class VehicleAssignmentsRepository {
  constructor(private prisma: PrismaService) {}

  private vehicleFleetFilter(fleetOwnerId?: string | null): Prisma.VehicleAssignmentWhereInput {
    if (!fleetOwnerId) return {};
    return { vehicle: { fleetOwnerId, deletedAt: null } };
  }

  runInTransaction<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(fn);
  }

  create(data: AssignmentCreateData, tx?: Prisma.TransactionClient) {
    const client = tx ?? this.prisma;
    return client.vehicleAssignment.create({
      data: {
        vehicleId: data.vehicleId,
        driverId: data.driverId,
        assignedById: data.assignedById,
        notes: data.notes,
      },
      include: ASSIGNMENT_INCLUDE,
    });
  }

  findById(id: string, fleetOwnerId?: string | null) {
    return this.prisma.vehicleAssignment.findFirst({
      where: { id, ...this.vehicleFleetFilter(fleetOwnerId) },
      include: ASSIGNMENT_INCLUDE,
    });
  }

  findActiveByVehicle(vehicleId: string, fleetOwnerId?: string | null) {
    return this.prisma.vehicleAssignment.findFirst({
      where: { vehicleId, releasedAt: null, ...this.vehicleFleetFilter(fleetOwnerId) },
      include: ASSIGNMENT_INCLUDE,
    });
  }

  findActiveByDriver(driverId: string, fleetOwnerId?: string | null) {
    return this.prisma.vehicleAssignment.findFirst({
      where: { driverId, releasedAt: null, ...this.vehicleFleetFilter(fleetOwnerId) },
      include: ASSIGNMENT_INCLUDE,
    });
  }

  findAll(query: AssignmentListQueryDto, fleetOwnerId?: string | null) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where = this.buildWhere(query, fleetOwnerId);

    return Promise.all([
      this.prisma.vehicleAssignment.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { assignedAt: 'desc' },
        include: ASSIGNMENT_INCLUDE,
      }),
      this.prisma.vehicleAssignment.count({ where }),
    ]).then(([data, total]) => ({ data, total, page, limit }));
  }

  findHistory(page: number, limit: number, fleetOwnerId?: string | null) {
    const where = this.vehicleFleetFilter(fleetOwnerId);

    return Promise.all([
      this.prisma.vehicleAssignment.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { assignedAt: 'desc' },
        include: ASSIGNMENT_INCLUDE,
      }),
      this.prisma.vehicleAssignment.count({ where }),
    ]).then(([data, total]) => ({ data, total, page, limit }));
  }

  release(id: string, data: AssignmentReleaseData, tx?: Prisma.TransactionClient) {
    const client = tx ?? this.prisma;
    return client.vehicleAssignment.update({
      where: { id },
      data: {
        releasedAt: data.releasedAt,
        releaseReason: data.releaseReason,
      },
      include: ASSIGNMENT_INCLUDE,
    });
  }

  countActive(fleetOwnerId?: string | null) {
    return this.prisma.vehicleAssignment.count({
      where: { releasedAt: null, ...this.vehicleFleetFilter(fleetOwnerId) },
    });
  }

  countActiveByVehicle(fleetOwnerId?: string | null) {
    return this.countActive(fleetOwnerId);
  }

  private buildWhere(
    query: AssignmentListQueryDto,
    fleetOwnerId?: string | null,
  ): Prisma.VehicleAssignmentWhereInput {
    const where: Prisma.VehicleAssignmentWhereInput = {
      ...this.vehicleFleetFilter(fleetOwnerId),
    };

    if (query.vehicleId) where.vehicleId = query.vehicleId;
    if (query.driverId) where.driverId = query.driverId;

    if (query.status === AssignmentStatus.ACTIVE) {
      where.releasedAt = null;
    } else if (query.status === AssignmentStatus.RELEASED) {
      where.releasedAt = { not: null };
    }

    return where;
  }
}
