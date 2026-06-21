import { IsOptional, IsInt, IsString, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class StartDriverShiftDto {
  @ApiPropertyOptional({ example: 125000, description: 'Defaults to vehicle current mileage' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  openingMileage?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
