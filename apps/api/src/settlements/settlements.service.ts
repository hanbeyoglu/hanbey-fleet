import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { JwtPayload } from '@hanbey-fleet/shared';
import { SettlementsRepository } from './settlements.repository';
import { DriverReportsRepository } from '../driver-reports/driver-reports.repository';
import { TimelineService } from '../timeline/timeline.service';
import { NotificationsService } from '../notifications/notifications.service';
import { FleetScopeService } from '../common/fleet/fleet-scope.service';
import { CreateSettlementDto } from './dto/create-settlement.dto';
import { SettlementListQueryDto } from './dto/settlement-list-query.dto';
import { SettlementResponseDto } from './dto/settlement-response.dto';
import { SettlementMapper } from './mappers/settlement.mapper';
import {
  SettlementStatus,
  TimelineEventType,
  PaginatedResponse,
} from '@hanbey-fleet/shared';

@Injectable()
export class SettlementsService {
  constructor(
    private repo: SettlementsRepository,
    private driverReportsRepo: DriverReportsRepository,
    private timeline: TimelineService,
    private notificationsService: NotificationsService,
    private fleetScope: FleetScopeService,
  ) {}

  async findAll(
    user: JwtPayload,
    query: SettlementListQueryDto,
  ): Promise<PaginatedResponse<SettlementResponseDto>> {
    const scope = this.fleetScope.resolve(user);
    const { data, total, page, limit } = await this.repo.findMany(query, scope.fleetOwnerId);

    return SettlementMapper.toPaginatedResponse(data, {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    });
  }

  async findOne(user: JwtPayload, id: string): Promise<SettlementResponseDto> {
    const scope = this.fleetScope.resolve(user);
    const settlement = await this.repo.findById(id, scope.fleetOwnerId);
    if (!settlement) throw new NotFoundException(`Settlement ${id} not found`);
    return SettlementMapper.toResponse(settlement);
  }

  async create(user: JwtPayload, dto: CreateSettlementDto): Promise<SettlementResponseDto> {
    const scope = this.fleetScope.resolve(user);
    const report = await this.driverReportsRepo.findById(dto.driverReportId, scope.fleetOwnerId);
    if (!report) {
      throw new NotFoundException(`Driver report ${dto.driverReportId} not found`);
    }

    if (!report.isApproved) {
      throw new BadRequestException(
        'Settlement can only be created from an approved driver report',
      );
    }

    const existing = await this.repo.findByShiftId(report.shiftId, scope.fleetOwnerId);
    if (existing) {
      throw new ConflictException('A settlement already exists for this shift');
    }

    const declaredRevenue = this.toNumber(report.declaredRevenue);
    const declaredHgs = this.toNumber(report.declaredHgs);
    const vehiclePlate = report.shift?.vehicle?.plate ?? report.shift?.vehicleId ?? 'unknown';

    const settlement = await this.repo.runInTransaction(async (tx) => {
      const [actualHgsResult, expensesResult] = await Promise.all([
        this.repo.calculateActualHgs(report.shiftId, tx),
        this.repo.calculateExpenses(report.shiftId, tx),
      ]);

      const actualHgs = this.toNumber(actualHgsResult._sum.amount);
      const expenses = this.toNumber(expensesResult._sum.amount);
      const difference = this.roundCurrency(declaredHgs - actualHgs, 2);
      const netRevenue = this.roundCurrency(declaredRevenue - actualHgs - expenses, 2);
      const status =
        difference === 0 ? SettlementStatus.MATCHED : SettlementStatus.MISMATCH;

      const created = await this.repo.create(
        {
          shiftId: report.shiftId,
          driverReportId: report.id,
          declaredRevenue,
          declaredHgs,
          actualHgs,
          expenses,
          difference,
          netRevenue,
          status,
        },
        tx,
      );

      await this.timeline.create(
        {
          vehicleId: report.shift!.vehicleId,
          shiftId: report.shiftId,
          eventType: TimelineEventType.SETTLEMENT_CREATED,
          description: `Settlement created for vehicle ${vehiclePlate}: ${status}`,
          metadata: {
            settlementId: created.id,
            shiftId: report.shiftId,
            driverReportId: report.id,
            declaredRevenue,
            declaredHgs,
            actualHgs,
            expenses,
            difference,
            netRevenue,
            status,
          },
        },
        tx,
      );

      return created;
    });

    if (settlement.status === SettlementStatus.MISMATCH) {
      const withShift = await this.repo.findById(settlement.id, scope.fleetOwnerId);
      if (withShift) {
        const fleetOwnerId = withShift.shift?.vehicle?.fleetOwnerId;
        if (fleetOwnerId) {
          await this.notificationsService.notifySettlementMismatch(withShift, fleetOwnerId);
        }
      }
    }

    return SettlementMapper.toResponse(settlement);
  }

  async approve(user: JwtPayload, id: string): Promise<SettlementResponseDto> {
    const scope = this.fleetScope.resolve(user);
    const settlement = await this.repo.findById(id, scope.fleetOwnerId);
    if (!settlement) throw new NotFoundException(`Settlement ${id} not found`);

    if (settlement.status === SettlementStatus.APPROVED) {
      throw new BadRequestException('Settlement is already approved');
    }

    const vehiclePlate =
      settlement.shift?.vehicle?.plate ?? settlement.shift?.vehicleId ?? 'unknown';

    const approved = await this.repo.runInTransaction(async (tx) => {
      const updated = await this.repo.approve(id, user.sub, tx);

      await this.timeline.create(
        {
          vehicleId: settlement.shift!.vehicleId,
          shiftId: settlement.shiftId,
          eventType: TimelineEventType.SETTLEMENT_APPROVED,
          description: `Settlement approved for vehicle ${vehiclePlate}`,
          metadata: {
            settlementId: id,
            shiftId: settlement.shiftId,
            approvedById: user.sub,
            netRevenue: this.toNumber(settlement.netRevenue),
          },
        },
        tx,
      );

      return updated;
    });

    return SettlementMapper.toResponse(approved);
  }

  private toNumber(value: { toNumber(): number } | number | null | undefined): number {
    if (value === null || value === undefined) return 0;
    return typeof value === 'number' ? value : value.toNumber();
  }

  private roundCurrency(value: number, decimals: number): number {
    const factor = 10 ** decimals;
    return Math.round(value * factor) / factor;
  }
}
