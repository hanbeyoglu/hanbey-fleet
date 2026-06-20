import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ShiftStatus, ShiftType } from '@hanbey-fleet/shared';

export class ShiftVehicleSummaryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  plate: string;

  @ApiProperty()
  brand: string;

  @ApiProperty()
  model: string;
}

export class ShiftDriverSummaryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  email: string;
}

export class ShiftResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  vehicleId: string;

  @ApiProperty()
  driverId: string;

  @ApiProperty({ enum: ShiftStatus })
  status: ShiftStatus;

  @ApiPropertyOptional({ enum: ShiftType })
  type?: ShiftType | null;

  @ApiProperty()
  plannedStart: Date;

  @ApiProperty()
  plannedEnd: Date;

  @ApiPropertyOptional()
  actualStart?: Date | null;

  @ApiPropertyOptional()
  actualEnd?: Date | null;

  @ApiProperty()
  openingMileage: number;

  @ApiPropertyOptional()
  closingMileage?: number | null;

  @ApiPropertyOptional()
  cancelReason?: string | null;

  @ApiPropertyOptional()
  notes?: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional({ type: ShiftVehicleSummaryDto })
  vehicle?: ShiftVehicleSummaryDto;

  @ApiPropertyOptional({ type: ShiftDriverSummaryDto })
  driver?: ShiftDriverSummaryDto;
}
