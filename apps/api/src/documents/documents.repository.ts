import { Injectable } from '@nestjs/common';
import { DocumentType, MembershipStatus, OwnerType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { buildStatusDateFilter } from './utils/document-status.util';
import { DocumentListQueryDto } from './dto/document-list-query.dto';
import { DocumentStatus, DocumentSortField } from '@hanbey-fleet/shared';

const REVISIONS_INCLUDE = {
  revisions: { orderBy: { version: 'desc' as const } },
} satisfies Prisma.DocumentInclude;

export interface CreateDocumentData {
  ownerType: OwnerType;
  ownerId: string;
  title: string;
  type: DocumentType;
  issueDate?: Date;
  expiryDate?: Date;
}

export interface CreateRevisionData {
  documentId: string;
  version: number;
  fileName: string;
  fileUrl: string;
  mimeType: string;
  size: number;
}

export interface UpdateDocumentData {
  title?: string;
  type?: DocumentType;
  issueDate?: Date | null;
  expiryDate?: Date | null;
}

@Injectable()
export class DocumentsRepository {
  constructor(private prisma: PrismaService) {}

  runInTransaction<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(fn);
  }

  async findMany(query: DocumentListQueryDto, fleetOwnerId?: string | null) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const sortBy = query.sortBy ?? DocumentSortField.CREATED_AT;
    const sortOrder = query.sortOrder ?? 'desc';
    const where = await this.buildWhereClause(query, fleetOwnerId);

    return Promise.all([
      this.prisma.document.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: REVISIONS_INCLUDE,
      }),
      this.prisma.document.count({ where }),
    ]).then(([data, total]) => ({ data, total, page, limit }));
  }

  async findById(id: string, tx?: Prisma.TransactionClient, fleetOwnerId?: string | null) {
    const client = tx ?? this.prisma;
    const fleetFilter = fleetOwnerId ? await this.buildFleetOwnerFilter(fleetOwnerId) : {};
    return client.document.findFirst({
      where: { id, deletedAt: null, ...fleetFilter },
      include: REVISIONS_INCLUDE,
    });
  }

  async findExpired(limit = 10, fleetOwnerId?: string | null) {
    const now = new Date();
    const fleetFilter = fleetOwnerId ? await this.buildFleetOwnerFilter(fleetOwnerId) : {};
    return this.prisma.document.findMany({
      where: {
        deletedAt: null,
        expiryDate: { lt: now },
        ...fleetFilter,
      },
      orderBy: { expiryDate: 'asc' },
      take: limit,
      include: REVISIONS_INCLUDE,
    });
  }

  async findExpiring(withinDays: number, fleetOwnerId?: string | null) {
    const now = new Date();
    const threshold = new Date(now);
    threshold.setDate(threshold.getDate() + withinDays);
    const fleetFilter = fleetOwnerId ? await this.buildFleetOwnerFilter(fleetOwnerId) : {};

    return this.prisma.document.findMany({
      where: {
        deletedAt: null,
        expiryDate: { gte: now, lte: threshold },
        ...fleetFilter,
      },
      include: REVISIONS_INCLUDE,
    });
  }

  async countByStatus(referenceDate = new Date(), fleetOwnerId?: string | null) {
    const fleetFilter = fleetOwnerId ? await this.buildFleetOwnerFilter(fleetOwnerId) : {};
    const expiringFilter = buildStatusDateFilter(DocumentStatus.EXPIRING, referenceDate);
    const expiredFilter = buildStatusDateFilter(DocumentStatus.EXPIRED, referenceDate);
    const validFilter = buildStatusDateFilter(DocumentStatus.VALID, referenceDate);

    return Promise.all([
      this.prisma.document.count({
        where: { deletedAt: null, ...fleetFilter, ...expiredFilter },
      }),
      this.prisma.document.count({
        where: { deletedAt: null, ...fleetFilter, ...expiringFilter },
      }),
      this.prisma.document.count({
        where: { deletedAt: null, ...fleetFilter, ...validFilter },
      }),
    ]).then(([expired, expiring, valid]) => ({ expired, expiring, valid }));
  }

  createDocument(data: CreateDocumentData, tx?: Prisma.TransactionClient) {
    const client = tx ?? this.prisma;
    return client.document.create({
      data,
      include: REVISIONS_INCLUDE,
    });
  }

  createRevision(data: CreateRevisionData, tx?: Prisma.TransactionClient) {
    const client = tx ?? this.prisma;
    return client.documentRevision.create({ data });
  }

  update(id: string, data: UpdateDocumentData, tx?: Prisma.TransactionClient) {
    const client = tx ?? this.prisma;
    return client.document.update({
      where: { id },
      data,
      include: REVISIONS_INCLUDE,
    });
  }

  softDelete(id: string, tx?: Prisma.TransactionClient) {
    const client = tx ?? this.prisma;
    return client.document.update({
      where: { id },
      data: { deletedAt: new Date() },
      include: REVISIONS_INCLUDE,
    });
  }

  getLatestVersion(documentId: string, tx?: Prisma.TransactionClient) {
    const client = tx ?? this.prisma;
    return client.documentRevision.findFirst({
      where: { documentId },
      orderBy: { version: 'desc' },
      select: { version: true },
    });
  }

  findLatestShiftVehicleForDriver(driverId: string) {
    return this.prisma.shift.findFirst({
      where: { driverId, deletedAt: null },
      orderBy: { updatedAt: 'desc' },
      select: { vehicleId: true },
    });
  }

  private async buildFleetOwnerFilter(fleetOwnerId: string): Promise<Prisma.DocumentWhereInput> {
    const [vehicles, drivers] = await Promise.all([
      this.prisma.vehicle.findMany({
        where: { fleetOwnerId, deletedAt: null },
        select: { id: true },
      }),
      this.prisma.driver.findMany({
        where: {
          deletedAt: null,
          user: {
            fleetMemberships: {
              some: { fleetOwnerId, status: MembershipStatus.ACTIVE },
            },
          },
        },
        select: { id: true },
      }),
    ]);

    return {
      OR: [
        { ownerType: OwnerType.VEHICLE, ownerId: { in: vehicles.map((v) => v.id) } },
        { ownerType: OwnerType.DRIVER, ownerId: { in: drivers.map((d) => d.id) } },
      ],
    };
  }

  private async buildWhereClause(
    query: DocumentListQueryDto,
    fleetOwnerId?: string | null,
  ): Promise<Prisma.DocumentWhereInput> {
    const where: Prisma.DocumentWhereInput = { deletedAt: null };

    if (fleetOwnerId) {
      Object.assign(where, await this.buildFleetOwnerFilter(fleetOwnerId));
    }

    if (query.ownerType) where.ownerType = query.ownerType;
    if (query.ownerId) where.ownerId = query.ownerId;
    if (query.type) where.type = query.type;
    if (query.search) {
      where.title = { contains: query.search, mode: 'insensitive' };
    }
    if (query.status) {
      Object.assign(where, buildStatusDateFilter(query.status));
    }

    return where;
  }
}
