import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { JwtPayload } from '@hanbey-fleet/shared';
import { ExpensesRepository, UpdateExpenseData } from './expenses.repository';
import { VehiclesRepository } from '../vehicles/vehicles.repository';
import { ShiftsRepository } from '../shifts/shifts.repository';
import { TimelineService } from '../timeline/timeline.service';
import { FleetScopeService } from '../common/fleet/fleet-scope.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { ExpenseListQueryDto } from './dto/expense-list-query.dto';
import { ExpenseResponseDto } from './dto/expense-response.dto';
import { ExpenseMapper } from './mappers/expense.mapper';
import { TimelineEventType, PaginatedResponse } from '@hanbey-fleet/shared';

@Injectable()
export class ExpensesService {
  constructor(
    private repo: ExpensesRepository,
    private vehiclesRepo: VehiclesRepository,
    private shiftsRepo: ShiftsRepository,
    private timeline: TimelineService,
    private fleetScope: FleetScopeService,
  ) {}

  async findAll(user: JwtPayload, query: ExpenseListQueryDto): Promise<PaginatedResponse<ExpenseResponseDto>> {
    const scope = this.fleetScope.resolve(user);
    const { data, total, page, limit } = await this.repo.findMany(query, scope.fleetOwnerId);

    return ExpenseMapper.toPaginatedResponse(data, {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    });
  }

  async findOne(user: JwtPayload, id: string): Promise<ExpenseResponseDto> {
    const scope = this.fleetScope.resolve(user);
    const expense = await this.repo.findById(id, scope.fleetOwnerId);
    if (!expense) throw new NotFoundException(`Expense ${id} not found`);
    return ExpenseMapper.toResponse(expense);
  }

  async create(user: JwtPayload, dto: CreateExpenseDto): Promise<ExpenseResponseDto> {
    const scope = this.fleetScope.resolve(user);
    await this.assertVehicleExists(dto.vehicleId, scope.fleetOwnerId);
    await this.assertShiftBelongsToVehicle(dto.shiftId, dto.vehicleId, scope.fleetOwnerId);
    this.assertAmountPositive(dto.amount);

    const expenseDate = new Date(dto.expenseDate);
    this.assertValidDate(expenseDate);

    const expense = await this.repo.create({
      vehicleId: dto.vehicleId,
      shiftId: dto.shiftId,
      category: dto.category,
      amount: dto.amount,
      expenseDate,
      note: dto.note,
      receiptUrl: dto.receiptUrl,
    });

    const vehiclePlate = expense.vehicle?.plate ?? dto.vehicleId;

    await this.timeline.create({
      vehicleId: dto.vehicleId,
      shiftId: dto.shiftId,
      eventType: TimelineEventType.EXPENSE_CREATED,
      description: `${dto.category} expense recorded for vehicle ${vehiclePlate}: ${dto.amount} TL`,
      metadata: {
        expenseId: expense.id,
        category: dto.category,
        amount: dto.amount,
        shiftId: dto.shiftId ?? null,
      },
    });

    return ExpenseMapper.toResponse(expense);
  }

  async update(user: JwtPayload, id: string, dto: UpdateExpenseDto): Promise<ExpenseResponseDto> {
    const scope = this.fleetScope.resolve(user);
    const existing = await this.repo.findById(id, scope.fleetOwnerId);
    if (!existing) throw new NotFoundException(`Expense ${id} not found`);

    if (dto.amount !== undefined) {
      this.assertAmountPositive(dto.amount);
    }

    if (dto.shiftId !== undefined) {
      await this.assertShiftBelongsToVehicle(dto.shiftId, existing.vehicleId, scope.fleetOwnerId);
    }

    const updateData: UpdateExpenseData = {};

    if (dto.shiftId !== undefined) updateData.shiftId = dto.shiftId;
    if (dto.category !== undefined) updateData.category = dto.category;
    if (dto.amount !== undefined) updateData.amount = dto.amount;
    if (dto.note !== undefined) updateData.note = dto.note;
    if (dto.receiptUrl !== undefined) updateData.receiptUrl = dto.receiptUrl;

    if (dto.expenseDate !== undefined) {
      const expenseDate = new Date(dto.expenseDate);
      this.assertValidDate(expenseDate);
      updateData.expenseDate = expenseDate;
    }

    const expense = await this.repo.update(id, updateData);
    const response = ExpenseMapper.toResponse(expense);
    const vehiclePlate = expense.vehicle?.plate ?? expense.vehicleId;

    await this.timeline.create({
      vehicleId: expense.vehicleId,
      shiftId: expense.shiftId ?? undefined,
      eventType: TimelineEventType.EXPENSE_UPDATED,
      description: `${response.category} expense updated for vehicle ${vehiclePlate}`,
      metadata: {
        expenseId: expense.id,
        category: response.category,
        amount: response.amount,
        shiftId: expense.shiftId,
      },
    });

    return response;
  }

  async remove(user: JwtPayload, id: string): Promise<ExpenseResponseDto> {
    const scope = this.fleetScope.resolve(user);
    const existing = await this.repo.findById(id, scope.fleetOwnerId);
    if (!existing) throw new NotFoundException(`Expense ${id} not found`);

    const expense = await this.repo.softDelete(id);
    const response = ExpenseMapper.toResponse(expense);
    const vehiclePlate = expense.vehicle?.plate ?? expense.vehicleId;

    await this.timeline.create({
      vehicleId: expense.vehicleId,
      shiftId: expense.shiftId ?? undefined,
      eventType: TimelineEventType.EXPENSE_DELETED,
      description: `${response.category} expense removed for vehicle ${vehiclePlate}`,
      metadata: {
        expenseId: expense.id,
        category: response.category,
        amount: response.amount,
      },
    });

    return response;
  }

  private async assertVehicleExists(vehicleId: string, fleetOwnerId?: string | null) {
    const vehicle = await this.vehiclesRepo.findById(vehicleId, fleetOwnerId);
    if (!vehicle) {
      throw new NotFoundException(`Vehicle ${vehicleId} not found`);
    }
  }

  private async assertShiftBelongsToVehicle(
    shiftId: string | undefined,
    vehicleId: string,
    fleetOwnerId?: string | null,
  ) {
    if (!shiftId) return;

    const shift = await this.shiftsRepo.findById(shiftId, fleetOwnerId);
    if (!shift) {
      throw new NotFoundException(`Shift ${shiftId} not found`);
    }

    if (shift.vehicleId !== vehicleId) {
      throw new BadRequestException('Shift does not belong to the specified vehicle');
    }
  }

  private assertAmountPositive(amount: number) {
    if (amount <= 0) {
      throw new BadRequestException('Expense amount must be greater than zero');
    }
  }

  private assertValidDate(date: Date) {
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException('Expense date is invalid');
    }
  }
}
