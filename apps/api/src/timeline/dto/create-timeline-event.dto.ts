import { IsString, IsUUID, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TimelineEventType } from '@hanbey-fleet/shared';

export class CreateTimelineEventDto {
  @ApiProperty()
  @IsUUID()
  vehicleId: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  shiftId?: string;

  @ApiProperty({ enum: TimelineEventType })
  @IsString()
  eventType: string;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiPropertyOptional()
  @IsOptional()
  metadata?: Record<string, unknown>;
}
