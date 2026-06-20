import { DriverReport, User } from '@prisma/client';
import {
  DriverReportResponseDto,
  DriverReportApproverDto,
  DriverReportShiftSummaryDto,
} from '../dto/driver-report-response.dto';
import { DriverReportSource } from '@hanbey-fleet/shared';

type DecimalLike = { toNumber(): number } | number | null | undefined;

type DriverReportWithRelations = DriverReport & {
  approvedBy?: Pick<User, 'id' | 'name' | 'username' | 'email'> | null;
  shift?: {
    id: string;
    vehicleId: string;
    driverId: string;
    vehicle?: { plate: string } | null;
  } | null;
};

export class DriverReportMapper {
  static toResponse(report: DriverReportWithRelations): DriverReportResponseDto {
    return {
      id: report.id,
      shiftId: report.shiftId,
      source: report.source as DriverReportSource,
      rawMessage: report.rawMessage,
      declaredRevenue: DriverReportMapper.toNumber(report.declaredRevenue),
      declaredHgs: DriverReportMapper.toNumber(report.declaredHgs),
      declaredTotal: DriverReportMapper.toNumber(report.declaredTotal),
      notes: report.notes,
      isApproved: report.isApproved,
      approvedById: report.approvedById,
      approvedAt: report.approvedAt,
      cashRevenue: DriverReportMapper.toOptionalNumber(report.cashRevenue),
      cardRevenue: DriverReportMapper.toOptionalNumber(report.cardRevenue),
      posRevenue: DriverReportMapper.toOptionalNumber(report.posRevenue),
      tips: DriverReportMapper.toOptionalNumber(report.tips),
      cashDelivered: DriverReportMapper.toOptionalNumber(report.cashDelivered),
      createdAt: report.createdAt,
      updatedAt: report.updatedAt,
      approvedBy: report.approvedBy
        ? DriverReportMapper.toApprover(report.approvedBy)
        : null,
      shift: report.shift ? DriverReportMapper.toShiftSummary(report.shift) : undefined,
    };
  }

  private static toNumber(value: DecimalLike): number {
    if (value === null || value === undefined) return 0;
    return typeof value === 'number' ? value : value.toNumber();
  }

  private static toOptionalNumber(value: DecimalLike): number | null {
    if (value === null || value === undefined) return null;
    return typeof value === 'number' ? value : value.toNumber();
  }

  private static toApprover(user: Pick<User, 'id' | 'name' | 'username' | 'email'>): DriverReportApproverDto {
    return { id: user.id, name: user.name, username: user.username, email: user.email };
  }

  private static toShiftSummary(
    shift: {
      id: string;
      vehicleId: string;
      driverId: string;
      vehicle?: { plate: string } | null;
    },
  ): DriverReportShiftSummaryDto {
    return {
      id: shift.id,
      vehicleId: shift.vehicleId,
      driverId: shift.driverId,
      vehiclePlate: shift.vehicle?.plate,
    };
  }
}
