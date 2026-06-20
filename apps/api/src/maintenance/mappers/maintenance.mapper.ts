import { Expense, MaintenanceRecord, Vehicle } from '@prisma/client';
import {
  MaintenanceExpenseSummaryDto,
  MaintenanceResponseDto,
  MaintenanceVehicleSummaryDto,
} from '../dto/maintenance-response.dto';
import { PaginatedResponse, PaginationMeta } from '@hanbey-fleet/shared';

type DecimalLike = { toNumber(): number } | number | null | undefined;

type MaintenanceWithRelations = MaintenanceRecord & {
  vehicle?: Pick<Vehicle, 'id' | 'plate' | 'brand' | 'model'>;
  expense?: Pick<Expense, 'id' | 'amount' | 'expenseDate'> | null;
};

export class MaintenanceMapper {
  static toResponse(record: MaintenanceWithRelations): MaintenanceResponseDto {
    return {
      id: record.id,
      vehicleId: record.vehicleId,
      expenseId: record.expenseId,
      description: record.description,
      cost: MaintenanceMapper.toNumber(record.cost),
      date: record.date,
      mileage: record.mileage,
      serviceProvider: record.serviceProvider,
      warrantyUntil: record.warrantyUntil,
      nextMaintenanceMileage: record.nextMaintenanceMileage,
      notes: record.notes,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      vehicle: record.vehicle ? MaintenanceMapper.toVehicleSummary(record.vehicle) : undefined,
      expense: record.expense ? MaintenanceMapper.toExpenseSummary(record.expense) : null,
    };
  }

  static toPaginatedResponse(
    records: MaintenanceWithRelations[],
    meta: PaginationMeta,
  ): PaginatedResponse<MaintenanceResponseDto> {
    return {
      data: records.map(MaintenanceMapper.toResponse),
      meta,
    };
  }

  private static toVehicleSummary(
    vehicle: Pick<Vehicle, 'id' | 'plate' | 'brand' | 'model'>,
  ): MaintenanceVehicleSummaryDto {
    return {
      id: vehicle.id,
      plate: vehicle.plate,
      brand: vehicle.brand,
      model: vehicle.model,
    };
  }

  private static toExpenseSummary(
    expense: Pick<Expense, 'id' | 'amount' | 'expenseDate'>,
  ): MaintenanceExpenseSummaryDto {
    return {
      id: expense.id,
      amount: MaintenanceMapper.toNumber(expense.amount),
      expenseDate: expense.expenseDate,
    };
  }

  private static toNumber(value: DecimalLike): number {
    if (value === null || value === undefined) return 0;
    return typeof value === 'number' ? value : value.toNumber();
  }
}
