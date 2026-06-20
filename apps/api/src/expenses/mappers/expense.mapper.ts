import { Expense, Vehicle, Shift } from '@prisma/client';
import {
  ExpenseResponseDto,
  ExpenseVehicleSummaryDto,
  ExpenseShiftSummaryDto,
} from '../dto/expense-response.dto';
import { ExpenseCategory, PaginatedResponse, PaginationMeta, ShiftStatus } from '@hanbey-fleet/shared';

type DecimalLike = { toNumber(): number } | number | null | undefined;

type ExpenseWithRelations = Expense & {
  vehicle?: Pick<Vehicle, 'id' | 'plate'>;
  shift?: Pick<Shift, 'id' | 'status'> | null;
};

export class ExpenseMapper {
  static toResponse(expense: ExpenseWithRelations): ExpenseResponseDto {
    return {
      id: expense.id,
      vehicleId: expense.vehicleId,
      shiftId: expense.shiftId,
      category: expense.category as ExpenseCategory,
      amount: ExpenseMapper.toNumber(expense.amount),
      expenseDate: expense.expenseDate,
      note: expense.note,
      receiptUrl: expense.receiptUrl,
      createdAt: expense.createdAt,
      updatedAt: expense.updatedAt,
      vehicle: expense.vehicle ? ExpenseMapper.toVehicleSummary(expense.vehicle) : undefined,
      shift: expense.shift ? ExpenseMapper.toShiftSummary(expense.shift) : null,
    };
  }

  static toPaginatedResponse(
    expenses: ExpenseWithRelations[],
    meta: PaginationMeta,
  ): PaginatedResponse<ExpenseResponseDto> {
    return {
      data: expenses.map(ExpenseMapper.toResponse),
      meta,
    };
  }

  private static toVehicleSummary(vehicle: Pick<Vehicle, 'id' | 'plate'>): ExpenseVehicleSummaryDto {
    return { id: vehicle.id, plate: vehicle.plate };
  }

  private static toShiftSummary(shift: Pick<Shift, 'id' | 'status'>): ExpenseShiftSummaryDto {
    return { id: shift.id, status: shift.status as ShiftStatus };
  }

  private static toNumber(value: DecimalLike): number {
    if (value === null || value === undefined) return 0;
    return typeof value === 'number' ? value : value.toNumber();
  }
}
