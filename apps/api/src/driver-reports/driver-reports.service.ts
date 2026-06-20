import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { DriverReportsRepository } from './driver-reports.repository';
import { ShiftsRepository } from '../shifts/shifts.repository';
import { TimelineRepository } from '../timeline/timeline.repository';
import { CreateDriverReportDto } from './dto/create-driver-report.dto';
import { DriverReportResponseDto } from './dto/driver-report-response.dto';
import { DriverReportMapper } from './mappers/driver-report.mapper';
import { DriverReportSource, TimelineEventType } from '@hanbey-fleet/shared';

@Injectable()
export class DriverReportsService {
  constructor(
    private repo: DriverReportsRepository,
    private shiftsRepo: ShiftsRepository,
    private timelineRepo: TimelineRepository,
  ) {}

  async submit(dto: CreateDriverReportDto): Promise<DriverReportResponseDto> {
    const shift = await this.shiftsRepo.findCompletedById(dto.shiftId);
    if (!shift) {
      throw new BadRequestException(
        `Shift ${dto.shiftId} not found or is not COMPLETED`,
      );
    }

    if (shift.driverReport) {
      throw new ConflictException('A driver report already exists for this shift');
    }

    const data = {
      shiftId: dto.shiftId,
      source: dto.source ?? DriverReportSource.MANUAL,
      rawMessage: dto.rawMessage,
      declaredRevenue: dto.declaredRevenue,
      declaredHgs: dto.declaredHgs,
      declaredTotal: dto.declaredTotal,
      notes: dto.notes,
      cashRevenue: dto.cashRevenue,
      cardRevenue: dto.cardRevenue,
      posRevenue: dto.posRevenue,
      tips: dto.tips,
      cashDelivered: dto.cashDelivered,
    };

    const vehiclePlate = shift.vehicle?.plate ?? shift.vehicleId;

    const report = await this.repo.runInTransaction(async (tx) => {
      const created = await this.repo.create(data, tx);

      await this.timelineRepo.create(
        {
          vehicleId: shift.vehicleId,
          shiftId: shift.id,
          eventType: TimelineEventType.DRIVER_REPORT_SUBMITTED,
          description: `Driver declaration submitted for shift on vehicle ${vehiclePlate}`,
          metadata: {
            driverReportId: created.id,
            shiftId: shift.id,
            declaredRevenue: dto.declaredRevenue,
            declaredHgs: dto.declaredHgs,
            declaredTotal: dto.declaredTotal,
            source: data.source,
          },
        },
        tx,
      );

      return created;
    });

    return DriverReportMapper.toResponse(report);
  }

  async approve(id: string, approverId: string): Promise<DriverReportResponseDto> {
    const report = await this.repo.findById(id);
    if (!report) throw new NotFoundException(`Driver report ${id} not found`);

    if (report.isApproved) {
      throw new BadRequestException('Driver report is already approved and cannot be modified');
    }

    const vehiclePlate = report.shift?.vehicle?.plate ?? report.shift?.vehicleId ?? 'unknown';

    const approved = await this.repo.runInTransaction(async (tx) => {
      const updated = await this.repo.approve(id, approverId, tx);

      await this.timelineRepo.create(
        {
          vehicleId: report.shift!.vehicleId,
          shiftId: report.shiftId,
          eventType: TimelineEventType.DRIVER_REPORT_APPROVED,
          description: `Driver declaration approved for vehicle ${vehiclePlate}`,
          metadata: {
            driverReportId: id,
            shiftId: report.shiftId,
            approvedById: approverId,
          },
        },
        tx,
      );

      return updated;
    });

    return DriverReportMapper.toResponse(approved);
  }

  async findOne(id: string): Promise<DriverReportResponseDto> {
    const report = await this.repo.findById(id);
    if (!report) throw new NotFoundException(`Driver report ${id} not found`);
    return DriverReportMapper.toResponse(report);
  }

  async findByShiftId(shiftId: string): Promise<DriverReportResponseDto> {
    const report = await this.repo.findByShiftId(shiftId);
    if (!report) {
      throw new NotFoundException(`No driver report found for shift ${shiftId}`);
    }
    return DriverReportMapper.toResponse(report);
  }
}
