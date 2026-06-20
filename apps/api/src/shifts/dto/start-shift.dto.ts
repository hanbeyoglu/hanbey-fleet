import { IsUUID, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class StartShiftDto {
  @ApiProperty()
  @IsUUID()
  vehicleId: string;

  @ApiProperty()
  @IsUUID()
  driverId: string;

  @ApiProperty({ example: 125000 })
  @IsInt()
  @Min(0)
  openingMileage: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;
}
