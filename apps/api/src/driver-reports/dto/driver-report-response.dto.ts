import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DriverReportSource } from '@hanbey-fleet/shared';

export class DriverReportApproverDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  email: string;
}

export class DriverReportShiftSummaryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  vehicleId: string;

  @ApiProperty()
  driverId: string;

  @ApiPropertyOptional()
  vehiclePlate?: string;
}

export class DriverReportResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  shiftId: string;

  @ApiProperty({ enum: DriverReportSource })
  source: DriverReportSource;

  @ApiPropertyOptional()
  rawMessage?: string | null;

  @ApiProperty()
  declaredRevenue: number;

  @ApiProperty()
  declaredHgs: number;

  @ApiProperty()
  declaredTotal: number;

  @ApiPropertyOptional()
  notes?: string | null;

  @ApiProperty()
  isApproved: boolean;

  @ApiPropertyOptional()
  approvedById?: string | null;

  @ApiPropertyOptional()
  approvedAt?: Date | null;

  @ApiPropertyOptional()
  cashRevenue?: number | null;

  @ApiPropertyOptional()
  cardRevenue?: number | null;

  @ApiPropertyOptional()
  posRevenue?: number | null;

  @ApiPropertyOptional()
  tips?: number | null;

  @ApiPropertyOptional()
  cashDelivered?: number | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional({ type: DriverReportApproverDto })
  approvedBy?: DriverReportApproverDto | null;

  @ApiPropertyOptional({ type: DriverReportShiftSummaryDto })
  shift?: DriverReportShiftSummaryDto;
}
