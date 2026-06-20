import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VehicleStatus, TimelineEventType } from '@hanbey-fleet/shared';

export class VehicleResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ example: '34 ABC 123' })
  plate: string;

  @ApiProperty({ example: 'Toyota' })
  brand: string;

  @ApiProperty({ example: 'Corolla' })
  model: string;

  @ApiProperty({ example: 2022 })
  year: number;

  @ApiPropertyOptional({ example: 'White' })
  color?: string | null;

  @ApiProperty({ enum: VehicleStatus })
  status: VehicleStatus;

  @ApiProperty({ example: 125000 })
  currentMileage: number;

  @ApiPropertyOptional({ example: 'HGS-123456' })
  hgsTag?: string | null;

  @ApiPropertyOptional()
  notes?: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class ActiveShiftSummaryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  driverName: string;

  @ApiProperty()
  driverEmail: string;

  @ApiProperty()
  plannedStart: Date;

  @ApiProperty()
  plannedEnd: Date;

  @ApiPropertyOptional()
  actualStart?: Date | null;
}

export class TimelineEventSummaryDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: TimelineEventType })
  eventType: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  eventTime: Date;

  @ApiPropertyOptional()
  metadata?: Record<string, unknown> | null;
}

export class VehicleDetailResponseDto extends VehicleResponseDto {
  @ApiPropertyOptional({ type: ActiveShiftSummaryDto })
  activeShift?: ActiveShiftSummaryDto | null;

  @ApiProperty({ type: [TimelineEventSummaryDto] })
  timelineEvents: TimelineEventSummaryDto[];
}
