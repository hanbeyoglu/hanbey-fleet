import { IsString, IsInt, IsEnum, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VehicleStatus } from '@hanbey-fleet/shared';
import { Type } from 'class-transformer';

export class CreateVehicleDto {
  @ApiProperty({ example: '34 ABC 123' })
  @IsString()
  plate: string;

  @ApiProperty({ example: 'Toyota' })
  @IsString()
  brand: string;

  @ApiProperty({ example: 'Corolla' })
  @IsString()
  model: string;

  @ApiProperty({ example: 2022 })
  @IsInt()
  @Min(1990)
  @Max(new Date().getFullYear() + 1)
  year: number;

  @ApiPropertyOptional({ example: 'White' })
  @IsString()
  @IsOptional()
  color?: string;

  @ApiPropertyOptional({ example: 'HGS-123456' })
  @IsString()
  @IsOptional()
  hgsTag?: string;

  @ApiPropertyOptional({ enum: VehicleStatus, default: VehicleStatus.IDLE })
  @IsEnum(VehicleStatus)
  @IsOptional()
  status?: VehicleStatus;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ example: 5000, description: 'Daily vehicle fee (Araç Yevmiyesi)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  dailyFee?: number;

  // BR-151: Vehicle belongs to exactly one Fleet Owner
  @ApiPropertyOptional({ description: 'Fleet owner ID (BR-151). Required for fleet-scoped operations.' })
  @IsString()
  @IsOptional()
  fleetOwnerId?: string;
}
