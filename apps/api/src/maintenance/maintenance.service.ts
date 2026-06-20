import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import {
  MaintenanceRepository,
  UpdateMaintenanceData,
} from './maintenance.repository';
import { VehiclesRepository } from '../vehicles/vehicles.repository';
import { ExpensesRepository } from '../expenses/expenses.repository';
import { TimelineService } from '../timeline/timeline.service';
import { CreateMaintenanceDto } from './dto/create-maintenance.dto';
import { UpdateMaintenanceDto } from './dto/update-maintenance.dto';
import { MaintenanceListQueryDto } from './dto/maintenance-list-query.dto';
import { MaintenanceResponseDto } from './dto/maintenance-response.dto';
import { MaintenanceMapper } from './mappers/maintenance.mapper';
import { TimelineEventType, PaginatedResponse } from '@hanbey-fleet/shared';

@Injectable()
export class MaintenanceService {
  constructor(
    private repo: MaintenanceRepository,
    private vehiclesRepo: VehiclesRepository,
    private expensesRepo: ExpensesRepository,
    private timeline: TimelineService,
  ) {}

  async findAll(
    query: MaintenanceListQueryDto,
  ): Promise<PaginatedResponse<MaintenanceResponseDto>> {
    const { data, total, page, limit } = await this.repo.findMany(query);

    return MaintenanceMapper.toPaginatedResponse(data, {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    });
  }

  async findOne(id: string): Promise<MaintenanceResponseDto> {
    const record = await this.repo.findById(id);
    if (!record) throw new NotFoundException(`Maintenance record ${id} not found`);
    return MaintenanceMapper.toResponse(record);
  }

  async create(dto: CreateMaintenanceDto): Promise<MaintenanceResponseDto> {
    await this.assertVehicleExists(dto.vehicleId);
    this.assertCostPositive(dto.cost);

    const date = new Date(dto.date);
    this.assertValidDate(date, 'Maintenance date');

    if (dto.expenseId) {
      await this.assertExpenseAvailable(dto.expenseId, dto.vehicleId);
    }

    const warrantyUntil = dto.warrantyUntil ? new Date(dto.warrantyUntil) : undefined;
    if (warrantyUntil) {
      this.assertValidDate(warrantyUntil, 'Warranty date');
    }

    const record = await this.repo.create({
      vehicleId: dto.vehicleId,
      expenseId: dto.expenseId,
      description: dto.description,
      cost: dto.cost,
      date,
      mileage: dto.mileage,
      serviceProvider: dto.serviceProvider,
      warrantyUntil,
      nextMaintenanceMileage: dto.nextMaintenanceMileage,
      notes: dto.notes,
    });

    const vehiclePlate = record.vehicle?.plate ?? dto.vehicleId;

    await this.timeline.create({
      vehicleId: dto.vehicleId,
      eventType: TimelineEventType.MAINTENANCE_CREATED,
      description: `Maintenance recorded for vehicle ${vehiclePlate}: ${dto.description} — ${dto.cost} TL`,
      metadata: {
        maintenanceId: record.id,
        description: dto.description,
        cost: dto.cost,
        mileage: dto.mileage ?? null,
        serviceProvider: dto.serviceProvider ?? null,
        expenseId: dto.expenseId ?? null,
      },
    });

    return MaintenanceMapper.toResponse(record);
  }

  async update(id: string, dto: UpdateMaintenanceDto): Promise<MaintenanceResponseDto> {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundException(`Maintenance record ${id} not found`);

    if (dto.cost !== undefined) {
      this.assertCostPositive(dto.cost);
    }

    if (dto.expenseId !== undefined && dto.expenseId !== null) {
      await this.assertExpenseAvailable(dto.expenseId, existing.vehicleId, id);
    }

    const updateData: UpdateMaintenanceData = {};

    if (dto.expenseId !== undefined) updateData.expenseId = dto.expenseId;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.cost !== undefined) updateData.cost = dto.cost;
    if (dto.mileage !== undefined) updateData.mileage = dto.mileage;
    if (dto.serviceProvider !== undefined) updateData.serviceProvider = dto.serviceProvider;
    if (dto.nextMaintenanceMileage !== undefined) {
      updateData.nextMaintenanceMileage = dto.nextMaintenanceMileage;
    }
    if (dto.notes !== undefined) updateData.notes = dto.notes;

    if (dto.date !== undefined) {
      const date = new Date(dto.date);
      this.assertValidDate(date, 'Maintenance date');
      updateData.date = date;
    }

    if (dto.warrantyUntil !== undefined) {
      if (dto.warrantyUntil === null) {
        updateData.warrantyUntil = null;
      } else {
        const warrantyUntil = new Date(dto.warrantyUntil);
        this.assertValidDate(warrantyUntil, 'Warranty date');
        updateData.warrantyUntil = warrantyUntil;
      }
    }

    const record = await this.repo.update(id, updateData);
    const response = MaintenanceMapper.toResponse(record);
    const vehiclePlate = record.vehicle?.plate ?? record.vehicleId;

    await this.timeline.create({
      vehicleId: record.vehicleId,
      eventType: TimelineEventType.MAINTENANCE_UPDATED,
      description: `Maintenance updated for vehicle ${vehiclePlate}: ${response.description}`,
      metadata: {
        maintenanceId: record.id,
        description: response.description,
        cost: response.cost,
        expenseId: record.expenseId,
      },
    });

    return response;
  }

  async remove(id: string): Promise<MaintenanceResponseDto> {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundException(`Maintenance record ${id} not found`);

    const record = await this.repo.softDelete(id);
    const response = MaintenanceMapper.toResponse(record);
    const vehiclePlate = record.vehicle?.plate ?? record.vehicleId;

    await this.timeline.create({
      vehicleId: record.vehicleId,
      eventType: TimelineEventType.MAINTENANCE_DELETED,
      description: `Maintenance removed for vehicle ${vehiclePlate}: ${response.description}`,
      metadata: {
        maintenanceId: record.id,
        description: response.description,
        cost: response.cost,
      },
    });

    return response;
  }

  private async assertVehicleExists(vehicleId: string) {
    const vehicle = await this.vehiclesRepo.findById(vehicleId);
    if (!vehicle) {
      throw new NotFoundException(`Vehicle ${vehicleId} not found`);
    }
  }

  private async assertExpenseAvailable(
    expenseId: string,
    vehicleId: string,
    excludeMaintenanceId?: string,
  ) {
    const expense = await this.expensesRepo.findById(expenseId);
    if (!expense) {
      throw new NotFoundException(`Expense ${expenseId} not found`);
    }

    if (expense.vehicleId !== vehicleId) {
      throw new BadRequestException('Expense does not belong to the specified vehicle');
    }

    const linked = await this.repo.findByExpenseId(expenseId, excludeMaintenanceId);
    if (linked) {
      throw new ConflictException('Expense is already linked to another maintenance record');
    }
  }

  private assertCostPositive(cost: number) {
    if (cost <= 0) {
      throw new BadRequestException('Maintenance cost must be greater than zero');
    }
  }

  private assertValidDate(date: Date, label: string) {
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException(`${label} is invalid`);
    }
  }
}
