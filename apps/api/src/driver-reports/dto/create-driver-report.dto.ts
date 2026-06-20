import {
  IsUUID,
  IsEnum,
  IsOptional,
  IsString,
  IsNumber,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DriverReportSource } from '@hanbey-fleet/shared';
import { Type } from 'class-transformer';

export class CreateDriverReportDto {
  @ApiProperty()
  @IsUUID()
  shiftId: string;

  @ApiPropertyOptional({ enum: DriverReportSource, default: DriverReportSource.MANUAL })
  @IsOptional()
  @IsEnum(DriverReportSource)
  source?: DriverReportSource;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  rawMessage?: string;

  @ApiProperty({ example: 3500.0 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  declaredRevenue: number;

  @ApiProperty({ example: 120.5 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  declaredHgs: number;

  @ApiProperty({ example: 3620.5 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  declaredTotal: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  cashRevenue?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  cardRevenue?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  posRevenue?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  tips?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  cashDelivered?: number;
}
