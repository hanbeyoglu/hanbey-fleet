import { Injectable } from '@nestjs/common';
import { ExpenseCategory, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ExpenseListQueryDto } from './dto/expense-list-query.dto';

const EXPENSE_INCLUDE = {
  vehicle: { select: { id: true, plate: true } },
  shift: { select: { id: true, status: true } },
} satisfies Prisma.ExpenseInclude;

export interface CreateExpenseData {
  vehicleId: string;
  shiftId?: string;
  category: ExpenseCategory;
  amount: number;
  expenseDate: Date;
  note?: string;
  receiptUrl?: string;
}

export interface UpdateExpenseData {
  shiftId?: string | null;
  category?: ExpenseCategory;
  amount?: number;
  expenseDate?: Date;
  note?: string;
  receiptUrl?: string;
}

@Injectable()
export class ExpensesRepository {
  constructor(private prisma: PrismaService) {}

  findMany(query: ExpenseListQueryDto, fleetOwnerId?: string | null) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const sortBy = query.sortBy ?? 'expenseDate';
    const sortOrder = query.sortOrder ?? 'desc';
    const where = this.buildWhereClause(query, fleetOwnerId);

    return Promise.all([
      this.prisma.expense.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: EXPENSE_INCLUDE,
      }),
      this.prisma.expense.count({ where }),
    ]).then(([data, total]) => ({ data, total, page, limit }));
  }

  findById(id: string, fleetOwnerId?: string | null) {
    return this.prisma.expense.findFirst({
      where: {
        id,
        deletedAt: null,
        ...(fleetOwnerId && { vehicle: { fleetOwnerId, deletedAt: null } }),
      },
      include: EXPENSE_INCLUDE,
    });
  }

  create(data: CreateExpenseData) {
    return this.prisma.expense.create({
      data: {
        vehicleId: data.vehicleId,
        shiftId: data.shiftId,
        category: data.category,
        amount: data.amount,
        expenseDate: data.expenseDate,
        note: data.note,
        receiptUrl: data.receiptUrl,
      },
      include: EXPENSE_INCLUDE,
    });
  }

  update(id: string, data: UpdateExpenseData) {
    return this.prisma.expense.update({
      where: { id },
      data: {
        ...(data.shiftId !== undefined && { shiftId: data.shiftId }),
        ...(data.category !== undefined && { category: data.category }),
        ...(data.amount !== undefined && { amount: data.amount }),
        ...(data.expenseDate !== undefined && { expenseDate: data.expenseDate }),
        ...(data.note !== undefined && { note: data.note }),
        ...(data.receiptUrl !== undefined && { receiptUrl: data.receiptUrl }),
      },
      include: EXPENSE_INCLUDE,
    });
  }

  softDelete(id: string) {
    return this.prisma.expense.update({
      where: { id },
      data: { deletedAt: new Date() },
      include: EXPENSE_INCLUDE,
    });
  }

  monthlyByCategory(vehicleId: string, year: number, month: number) {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 1);
    return this.prisma.expense.groupBy({
      by: ['category'],
      where: { vehicleId, deletedAt: null, expenseDate: { gte: start, lt: end } },
      _sum: { amount: true },
      _count: true,
    });
  }

  private buildWhereClause(
    query: ExpenseListQueryDto,
    fleetOwnerId?: string | null,
  ): Prisma.ExpenseWhereInput {
    const where: Prisma.ExpenseWhereInput = { deletedAt: null };

    if (fleetOwnerId) {
      where.vehicle = { fleetOwnerId, deletedAt: null };
    }

    if (query.category) {
      where.category = query.category;
    }

    if (query.vehicleId) {
      where.vehicleId = query.vehicleId;
    }

    if (query.shiftId) {
      where.shiftId = query.shiftId;
    }

    if (query.startDate || query.endDate) {
      where.expenseDate = {};
      if (query.startDate) {
        where.expenseDate.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        where.expenseDate.lte = new Date(query.endDate);
      }
    }

    if (query.search) {
      const term = query.search.trim();
      where.note = { contains: term, mode: 'insensitive' };
    }

    return where;
  }
}
