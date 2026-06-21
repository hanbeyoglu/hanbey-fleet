import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SettlementStatus } from '@hanbey-fleet/shared';

export class SettlementDriverSummaryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  username: string;
}

export class SettlementVehicleSummaryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  plate: string;

  @ApiProperty()
  brand: string;

  @ApiProperty()
  model: string;
}

export class SettlementShiftSummaryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  vehicleId: string;

  @ApiProperty()
  driverId: string;

  @ApiPropertyOptional()
  actualStart?: Date | null;

  @ApiPropertyOptional()
  actualEnd?: Date | null;

  @ApiPropertyOptional({ type: SettlementDriverSummaryDto })
  driver?: SettlementDriverSummaryDto;

  @ApiPropertyOptional({ type: SettlementVehicleSummaryDto })
  vehicle?: SettlementVehicleSummaryDto;
}

export class SettlementApproverSummaryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  username: string;
}

export class SettlementResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  shiftId: string;

  @ApiProperty()
  driverReportId: string;

  @ApiProperty({ example: 2500.0 })
  declaredRevenue: number;

  @ApiProperty({ example: 214.5 })
  declaredHgs: number;

  @ApiProperty({ example: 214.5 })
  actualHgs: number;

  @ApiProperty({ example: 300.0 })
  expenses: number;

  @ApiProperty({ example: 0.0 })
  difference: number;

  @ApiProperty({ example: 1985.5 })
  netRevenue: number;

  @ApiProperty({ enum: SettlementStatus })
  status: SettlementStatus;

  @ApiPropertyOptional()
  approvedById?: string | null;

  @ApiPropertyOptional()
  approvedAt?: Date | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional({ type: SettlementShiftSummaryDto })
  shift?: SettlementShiftSummaryDto;

  @ApiPropertyOptional({ type: SettlementApproverSummaryDto })
  approvedBy?: SettlementApproverSummaryDto | null;
}
