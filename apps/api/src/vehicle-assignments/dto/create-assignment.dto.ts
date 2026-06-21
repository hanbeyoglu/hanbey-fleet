import { IsUUID, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAssignmentDto {
  @ApiProperty({ description: 'Vehicle to assign', format: 'uuid' })
  @IsUUID()
  vehicleId: string;

  @ApiProperty({ description: 'Driver to assign', format: 'uuid' })
  @IsUUID()
  driverId: string;

  @ApiPropertyOptional({ description: 'Optional notes about the assignment' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
