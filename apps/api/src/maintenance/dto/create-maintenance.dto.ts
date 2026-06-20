import { IsUUID, IsDateString, IsNumber, IsOptional, IsString, IsInt, IsPositive } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateMaintenanceDto {
  @ApiProperty()
  @IsUUID()
  vehicleId: string;

  @ApiProperty({ example: 'Oil change and filter replacement' })
  @IsString()
  description: string;

  @ApiProperty({ example: 850.0 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  cost: number;

  @ApiProperty({ example: '2024-06-20T00:00:00.000Z' })
  @IsDateString()
  date: string;

  @ApiPropertyOptional({ example: 85000 })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  mileage?: number;

  @ApiPropertyOptional({ example: 'Toyota Yetkili Servis' })
  @IsString()
  @IsOptional()
  serviceProvider?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;
}
