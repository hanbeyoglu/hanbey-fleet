import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';

@Injectable()
export class ExpensesRepository {
  constructor(private prisma: PrismaService) {}

  findAll(vehicleId?: string) {
    return this.prisma.expense.findMany({
      where: { deletedAt: null, ...(vehicleId && { vehicleId }) },
      include: { vehicle: { select: { id: true, plate: true } } },
      orderBy: { expenseDate: 'desc' },
    });
  }

  findById(id: string) {
    return this.prisma.expense.findUnique({
      where: { id, deletedAt: null },
      include: { vehicle: { select: { id: true, plate: true } } },
    });
  }

  create(dto: CreateExpenseDto) {
    return this.prisma.expense.create({
      data: {
        vehicleId: dto.vehicleId,
        category: dto.category,
        amount: dto.amount,
        expenseDate: new Date(dto.expenseDate),
        note: dto.note,
        receiptUrl: dto.receiptUrl,
      },
    });
  }

  update(id: string, dto: UpdateExpenseDto) {
    return this.prisma.expense.update({
      where: { id },
      data: {
        ...dto,
        expenseDate: dto.expenseDate ? new Date(dto.expenseDate) : undefined,
      },
    });
  }

  softDelete(id: string) {
    return this.prisma.expense.update({ where: { id }, data: { deletedAt: new Date() } });
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
}
