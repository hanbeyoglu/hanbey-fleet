import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { ShiftStatus, ExpenseCategory, Prisma } from '@prisma/client';
import { DriversRepository } from '../drivers/drivers.repository';
import { VehicleAssignmentsRepository } from '../vehicle-assignments/vehicle-assignments.repository';
import { ShiftsRepository } from '../shifts/shifts.repository';
import { VehiclesRepository } from '../vehicles/vehicles.repository';
import { DriverReportsRepository } from '../driver-reports/driver-reports.repository';
import { TimelineRepository } from '../timeline/timeline.repository';
import { NotificationsService } from '../notifications/notifications.service';
import { DocumentsService } from '../documents/documents.service';
import { StartDriverShiftDto } from './dto/start-driver-shift.dto';
import { EndOfDayDto } from './dto/end-of-day.dto';
import {
  DriverPortalOverviewDto,
  DriverPortalProfileDto,
  DriverPortalAssignmentDto,
  EndOfDayResultDto,
} from './dto/driver-portal-response.dto';
import { DriverPortalMapper } from './mappers/driver-portal.mapper';
import { ShiftMapper } from '../shifts/mappers/shift.mapper';
import { DriverReportMapper } from '../driver-reports/mappers/driver-report.mapper';
import { ExpenseMapper } from '../expenses/mappers/expense.mapper';
import { computePlannedTimes } from '../shifts/utils/compute-planned-times';
import { FleetScopeService } from '../common/fleet/fleet-scope.service';
import {
  calculateCashToDeliver,
  DriverReportSource,
  TimelineEventType,
  VehicleStatus,
  OwnerType,
  PaginatedResponse,
  ShiftSortField,
  SortOrder,
  JwtPayload,
} from '@hanbey-fleet/shared';
import { ShiftResponseDto } from '../shifts/dto/shift-response.dto';
import { NotificationResponseDto } from '../notifications/dto/notification-response.dto';
import { DocumentResponseDto } from '../documents/dto/document-response.dto';
import { NotificationListQueryDto } from '../notifications/dto/notification-list-query.dto';
import { DocumentListQueryDto } from '../documents/dto/document-list-query.dto';

@Injectable()
export class DriverPortalService {
  constructor(
    private driversRepo: DriversRepository,
    private assignmentsRepo: VehicleAssignmentsRepository,
    private shiftsRepo: ShiftsRepository,
    private vehiclesRepo: VehiclesRepository,
    private driverReportsRepo: DriverReportsRepository,
    private timelineRepo: TimelineRepository,
    private notificationsService: NotificationsService,
    private documentsService: DocumentsService,
    private fleetScope: FleetScopeService,
  ) {}

  async getMe(user: JwtPayload): Promise<DriverPortalProfileDto> {
    const driver = await this.driversRepo.findByUserId(user.sub);
    if (!driver) {
      throw new NotFoundException('Driver profile not found for this user');
    }

    const driverWithUser = await this.driversRepo.findById(driver.id);
    if (!driverWithUser) {
      throw new NotFoundException('Driver profile not found');
    }

    return DriverPortalMapper.toProfile(driverWithUser);
  }

  async getOverview(user: JwtPayload): Promise<DriverPortalOverviewDto> {
    const scope = this.fleetScope.resolve(user);
    const driver = await this.requireDriver(user);
    const assignment = await this.assignmentsRepo.findActiveByDriver(driver.id, scope.fleetOwnerId);
    const activeShift = await this.shiftsRepo.findActiveByDriver(driver.id, scope.fleetOwnerId);

    return {
      profile: DriverPortalMapper.toProfile(driver),
      currentAssignment: assignment
        ? DriverPortalMapper.toAssignment(assignment)
        : null,
      activeShift: activeShift ? ShiftMapper.toResponse(activeShift) : null,
      canStartShift: !!assignment && !activeShift,
      canSubmitEndOfDay: !!activeShift,
    };
  }

  async getCurrentAssignment(user: JwtPayload): Promise<DriverPortalAssignmentDto | null> {
    const scope = this.fleetScope.resolve(user);
    const driver = await this.requireDriver(user);
    const assignment = await this.assignmentsRepo.findActiveByDriver(driver.id, scope.fleetOwnerId);
    return assignment ? DriverPortalMapper.toAssignment(assignment) : null;
  }

  async getCurrentShift(user: JwtPayload): Promise<ShiftResponseDto | null> {
    const scope = this.fleetScope.resolve(user);
    const driver = await this.requireDriver(user);
    const shift = await this.shiftsRepo.findActiveByDriver(driver.id, scope.fleetOwnerId);
    return shift ? ShiftMapper.toResponse(shift) : null;
  }

  async startShift(user: JwtPayload, dto: StartDriverShiftDto): Promise<ShiftResponseDto> {
    const scope = this.fleetScope.resolve(user);
    const driver = await this.requireDriver(user);

    const assignment = await this.assignmentsRepo.findActiveByDriver(driver.id, scope.fleetOwnerId);
    if (!assignment) {
      throw new BadRequestException(
        'An active vehicle assignment is required before starting a shift',
      );
    }

    if (await this.driversRepo.hasActiveShift(driver.id)) {
      throw new ConflictException('You already have an active shift');
    }

    const vehicle = await this.vehiclesRepo.findByIdForShift(assignment.vehicleId, scope.fleetOwnerId);
    if (!vehicle) {
      throw new NotFoundException(`Assigned vehicle ${assignment.vehicleId} not found`);
    }

    if (vehicle.status !== VehicleStatus.IDLE) {
      throw new BadRequestException(
        `Vehicle must be IDLE to start a shift. Current status: ${vehicle.status}`,
      );
    }

    if (await this.vehiclesRepo.hasActiveShift(vehicle.id)) {
      throw new ConflictException('Assigned vehicle already has an active shift');
    }

    const openingMileage = dto.openingMileage ?? vehicle.currentMileage;
    if (openingMileage < vehicle.currentMileage) {
      throw new BadRequestException(
        `Opening mileage (${openingMileage}) cannot be less than vehicle current mileage (${vehicle.currentMileage})`,
      );
    }

    const actualStart = new Date();
    const { type, plannedStart, plannedEnd } = computePlannedTimes(actualStart);

    const shift = await this.shiftsRepo.runInTransaction(async (tx) => {
      const created = await this.shiftsRepo.create(
        {
          vehicleId: vehicle.id,
          driverId: driver.id,
          plannedStart,
          plannedEnd,
          actualStart,
          status: ShiftStatus.ACTIVE,
          type,
          openingMileage,
          notes: dto.notes,
        },
        tx,
      );

      await this.vehiclesRepo.updateOperationalState(
        vehicle.id,
        { status: VehicleStatus.ACTIVE_SHIFT },
        tx,
      );

      await this.timelineRepo.create(
        {
          vehicleId: vehicle.id,
          shiftId: created.id,
          eventType: TimelineEventType.SHIFT_STARTED,
          description: `Shift started for vehicle ${vehicle.plate} by driver ${driver.user.name}`,
          metadata: {
            shiftId: created.id,
            driverId: driver.id,
            openingMileage,
            source: 'DRIVER_PORTAL',
          },
        },
        tx,
      );

      return created;
    });

    return ShiftMapper.toResponse(shift);
  }

  async submitEndOfDay(
    user: JwtPayload,
    shiftId: string,
    dto: EndOfDayDto,
  ): Promise<EndOfDayResultDto> {
    const scope = this.fleetScope.resolve(user);
    const driver = await this.requireDriver(user);
    const shift = await this.shiftsRepo.findById(shiftId, scope.fleetOwnerId);

    if (!shift) {
      throw new NotFoundException(`Shift ${shiftId} not found`);
    }

    if (shift.driverId !== driver.id) {
      throw new ForbiddenException('You can only submit end-of-day for your own shifts');
    }

    if (shift.status !== ShiftStatus.ACTIVE) {
      throw new BadRequestException('End-of-day can only be submitted for an ACTIVE shift');
    }

    const existingReport = await this.driverReportsRepo.findByShiftId(shiftId);
    if (existingReport) {
      throw new ConflictException('End-of-day has already been submitted for this shift');
    }

    const vehicle = await this.vehiclesRepo.findById(shift.vehicleId, scope.fleetOwnerId);
    if (!vehicle) {
      throw new NotFoundException(`Vehicle ${shift.vehicleId} not found`);
    }

    const dailyFee = DriverPortalMapper.toNumber(vehicle.dailyFee);
    if (dailyFee <= 0) {
      throw new BadRequestException(
        'Vehicle daily fee (Araç Yevmiyesi) must be configured before end-of-day submission',
      );
    }

    const declaredHgs = dto.declaredHgs ?? 0;
    const posAmount = dto.posAmount ?? 0;
    const expenseItems = dto.expenses ?? [];

    if (dto.updateMileage && dto.closingMileage === undefined) {
      throw new BadRequestException('closingMileage is required when updateMileage is true');
    }

    if (dto.updateMileage && dto.closingMileage! < shift.openingMileage) {
      throw new BadRequestException(
        `Closing mileage (${dto.closingMileage}) cannot be less than opening mileage (${shift.openingMileage})`,
      );
    }

    const actualEnd = new Date();
    const expenseDate = actualEnd;

    const result = await this.shiftsRepo.runInTransaction(async (tx) => {
      type CreatedExpense = Awaited<ReturnType<typeof tx.expense.create>>;
      const createdExpenses: CreatedExpense[] = [];

      for (const item of expenseItems) {
        const expense = await tx.expense.create({
          data: {
            vehicleId: shift.vehicleId,
            shiftId: shift.id,
            category: item.category as ExpenseCategory,
            amount: item.amount,
            expenseDate,
            note: item.note,
          },
          include: {
            vehicle: { select: { id: true, plate: true } },
            shift: { select: { id: true, status: true } },
          },
        });

        createdExpenses.push(expense);

        await this.timelineRepo.create(
          {
            vehicleId: shift.vehicleId,
            shiftId: shift.id,
            eventType: TimelineEventType.EXPENSE_CREATED,
            description: `${item.category} expense recorded for vehicle ${vehicle.plate}: ${item.amount} TL`,
            metadata: {
              expenseId: expense.id,
              category: item.category,
              amount: item.amount,
              shiftId: shift.id,
              source: 'DRIVER_PORTAL',
            },
          },
          tx,
        );
      }

      const totalExpenses = expenseItems.reduce((sum, item) => sum + item.amount, 0);
      const cashToDeliver = calculateCashToDeliver(
        dailyFee,
        declaredHgs,
        posAmount,
        totalExpenses,
      );

      const vehicleUpdate: { status: VehicleStatus; currentMileage?: number } = {
        status: VehicleStatus.IDLE,
      };

      if (dto.updateMileage && dto.closingMileage !== undefined) {
        vehicleUpdate.currentMileage = dto.closingMileage;
      }

      await this.vehiclesRepo.updateOperationalState(shift.vehicleId, vehicleUpdate, tx);

      const completedShift = await this.shiftsRepo.update(
        shift.id,
        {
          status: ShiftStatus.COMPLETED,
          actualEnd,
          closingMileage: dto.updateMileage ? dto.closingMileage : undefined,
          notes: dto.notes ?? shift.notes ?? undefined,
        },
        tx,
      );

      await this.timelineRepo.create(
        {
          vehicleId: shift.vehicleId,
          shiftId: shift.id,
          eventType: TimelineEventType.SHIFT_COMPLETED,
          description: `Shift completed for vehicle ${vehicle.plate}`,
          metadata: {
            shiftId: shift.id,
            openingMileage: shift.openingMileage,
            closingMileage: dto.closingMileage ?? null,
            source: 'DRIVER_PORTAL',
          },
        },
        tx,
      );

      const driverReport = await this.driverReportsRepo.create(
        {
          shiftId: shift.id,
          source: DriverReportSource.MOBILE,
          declaredRevenue: dailyFee,
          declaredHgs,
          declaredTotal: cashToDeliver,
          posRevenue: posAmount,
          notes: dto.notes,
        },
        tx,
      );

      await this.timelineRepo.create(
        {
          vehicleId: shift.vehicleId,
          shiftId: shift.id,
          eventType: TimelineEventType.DRIVER_REPORT_SUBMITTED,
          description: `Driver end-of-day submitted for vehicle ${vehicle.plate}`,
          metadata: {
            driverReportId: driverReport.id,
            shiftId: shift.id,
            declaredRevenue: dailyFee,
            declaredHgs,
            posAmount,
            totalExpenses,
            cashToDeliver,
            source: DriverReportSource.MOBILE,
          },
        },
        tx,
      );

      return { completedShift, driverReport, createdExpenses, totalExpenses, cashToDeliver };
    });

    return {
      cashToDeliver: result.cashToDeliver,
      dailyFee,
      declaredHgs,
      posAmount,
      totalExpenses: result.totalExpenses,
      shift: ShiftMapper.toResponse(result.completedShift),
      driverReport: DriverReportMapper.toResponse(result.driverReport),
      expenses: result.createdExpenses.map(ExpenseMapper.toResponse),
    };
  }

  async getShiftHistory(
    user: JwtPayload,
    page = 1,
    limit = 20,
  ): Promise<PaginatedResponse<ShiftResponseDto>> {
    const scope = this.fleetScope.resolve(user);
    const driver = await this.requireDriver(user);
    const { data, total } = await this.shiftsRepo.findHistory({
      driverId: driver.id,
      page,
      limit,
      sortBy: ShiftSortField.ACTUAL_START,
      sortOrder: SortOrder.DESC,
    }, scope.fleetOwnerId);

    return ShiftMapper.toPaginatedResponse(data, {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    });
  }

  async getDocuments(
    user: JwtPayload,
    query: DocumentListQueryDto,
  ): Promise<PaginatedResponse<DocumentResponseDto>> {
    const driver = await this.requireDriver(user);
    return this.documentsService.findAll(user, {
      ...query,
      ownerType: OwnerType.DRIVER,
      ownerId: driver.id,
    });
  }

  async getNotifications(
    user: JwtPayload,
    query: NotificationListQueryDto,
  ): Promise<PaginatedResponse<NotificationResponseDto>> {
    await this.requireDriver(user);
    return this.notificationsService.findMany(user.sub, query);
  }

  async markNotificationRead(user: JwtPayload, id: string): Promise<NotificationResponseDto> {
    await this.requireDriver(user);
    return this.notificationsService.markAsRead(user.sub, id);
  }

  async markAllNotificationsRead(user: JwtPayload): Promise<{ updated: number }> {
    await this.requireDriver(user);
    return this.notificationsService.markAllAsRead(user.sub);
  }

  private async requireDriver(user: JwtPayload) {
    const scope = this.fleetScope.resolve(user);
    const driver = await this.driversRepo.findByUserId(user.sub);
    if (!driver) {
      throw new NotFoundException('Driver profile not found for this user');
    }

    const driverWithUser = await this.driversRepo.findById(driver.id, scope.fleetOwnerId);
    if (!driverWithUser) {
      throw new ForbiddenException('Driver is not a member of the selected fleet');
    }

    return driverWithUser;
  }
}
