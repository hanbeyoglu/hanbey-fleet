import { Injectable, NotFoundException } from '@nestjs/common';
import { ExpensesRepository } from './expenses.repository';
import { TimelineService } from '../timeline/timeline.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { TimelineEventType } from '@hanbey-fleet/shared';

@Injectable()
export class ExpensesService {
  constructor(
    private repo: ExpensesRepository,
    private timeline: TimelineService,
  ) {}

  findAll(vehicleId?: string) {
    return this.repo.findAll(vehicleId);
  }

  async findOne(id: string) {
    const e = await this.repo.findById(id);
    if (!e) throw new NotFoundException(`Expense ${id} not found`);
    return e;
  }

  async create(dto: CreateExpenseDto) {
    const expense = await this.repo.create(dto);

    await this.timeline.create({
      vehicleId: dto.vehicleId,
      eventType: TimelineEventType.EXPENSE_CREATED,
      description: `${dto.category} expense recorded: ${dto.amount} TL`,
      metadata: { expenseId: expense.id, category: dto.category, amount: dto.amount },
    });

    return expense;
  }

  async update(id: string, dto: UpdateExpenseDto) {
    await this.findOne(id);
    return this.repo.update(id, dto);
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.repo.softDelete(id);
  }
}
