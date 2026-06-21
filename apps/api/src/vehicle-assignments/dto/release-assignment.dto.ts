import { IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ReleaseAssignmentDto {
  @ApiPropertyOptional({ description: 'Reason for releasing the assignment' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
