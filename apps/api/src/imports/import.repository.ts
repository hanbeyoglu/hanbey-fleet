import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ImportListQueryDto } from './dto/import-list-query.dto';
import { ImportSource, ImportStatus } from '@hanbey-fleet/shared';

export interface CreateImportJobData {
  source: ImportSource;
  status: ImportStatus;
  rawContent: string;
  parsedContent?: Prisma.InputJsonValue;
  error?: string;
}

export interface UpdateImportJobData {
  status?: ImportStatus;
  parsedContent?: Prisma.InputJsonValue;
  driverReportId?: string;
  error?: string;
}

const IMPORT_INCLUDE = {
  driverReport: {
    select: {
      id: true,
      shiftId: true,
      declaredRevenue: true,
      declaredHgs: true,
      declaredTotal: true,
    },
  },
} satisfies Prisma.ImportJobInclude;

@Injectable()
export class ImportRepository {
  constructor(private prisma: PrismaService) {}

  runInTransaction<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(fn);
  }

  create(data: CreateImportJobData, tx?: Prisma.TransactionClient) {
    const client = tx ?? this.prisma;
    return client.importJob.create({ data });
  }

  update(id: string, data: UpdateImportJobData, tx?: Prisma.TransactionClient) {
    const client = tx ?? this.prisma;
    return client.importJob.update({ where: { id }, data });
  }

  complete(id: string, driverReportId: string, tx?: Prisma.TransactionClient) {
    const client = tx ?? this.prisma;
    return client.importJob.update({
      where: { id },
      data: {
        status: ImportStatus.COMPLETED,
        driverReportId,
        error: null,
      },
      include: IMPORT_INCLUDE,
    });
  }

  findMany(query: ImportListQueryDto, fleetOwnerId?: string | null) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.ImportJobWhereInput = {
      deletedAt: null,
      ...(query.status && { status: query.status }),
      ...(query.source && { source: query.source }),
      ...(fleetOwnerId && {
        driverReport: {
          shift: { vehicle: { fleetOwnerId, deletedAt: null } },
        },
      }),
    };

    return Promise.all([
      this.prisma.importJob.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: IMPORT_INCLUDE,
      }),
      this.prisma.importJob.count({ where }),
    ]).then(([data, total]) => ({ data, total, page, limit }));
  }

  findById(id: string, fleetOwnerId?: string | null) {
    return this.prisma.importJob.findFirst({
      where: {
        id,
        deletedAt: null,
        ...(fleetOwnerId && {
          driverReport: {
            shift: { vehicle: { fleetOwnerId, deletedAt: null } },
          },
        }),
      },
      include: IMPORT_INCLUDE,
    });
  }

  softDeleteCompletedOlderThan(days: number) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    return this.prisma.importJob.updateMany({
      where: {
        status: ImportStatus.COMPLETED,
        deletedAt: null,
        createdAt: { lt: cutoff },
      },
      data: { deletedAt: new Date() },
    });
  }
}
