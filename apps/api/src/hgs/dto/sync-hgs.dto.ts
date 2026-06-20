import { IsUUID, IsDateString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SyncHgsDto {
  @ApiProperty({ description: 'Vehicle ID to sync HGS data for' })
  @IsUUID()
  vehicleId: string;

  @ApiPropertyOptional({ description: 'Sync from this date (ISO8601)' })
  @IsDateString()
  @IsOptional()
  fromDate?: string;

  @ApiPropertyOptional({ description: 'Sync until this date (ISO8601)' })
  @IsDateString()
  @IsOptional()
  toDate?: string;
}
