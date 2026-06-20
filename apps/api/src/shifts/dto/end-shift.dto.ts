import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class EndShiftDto {
  @ApiProperty({ example: 125340 })
  @IsInt()
  @Min(0)
  closingMileage: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;
}
