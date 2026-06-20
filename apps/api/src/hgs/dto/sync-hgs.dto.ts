import { IsString, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class SyncHgsDto {
  @ApiProperty({ example: 'HGS-100001' })
  @IsOptional()
  @IsString()
  referenceNo?: string;

  @ApiProperty({ example: '34ABC123' })
  @IsOptional()
  @IsString()
  vehiclePlate?: string;

  @ApiProperty({ example: '2026-06-21T12:30:00Z' })
  @IsOptional()
  @IsString()
  transitTime?: string;

  @ApiProperty({ example: 'FSM' })
  @IsOptional()
  @IsString()
  tollBooth?: string;

  @ApiProperty({ example: 125.5 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  amount?: number;

  @ApiPropertyOptional({ example: 'ISBANK' })
  @IsOptional()
  @IsString()
  provider?: string;
}
