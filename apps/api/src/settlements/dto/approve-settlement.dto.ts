import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ApproveSettlementDto {
  @ApiPropertyOptional({ description: 'Optional approval note' })
  @IsOptional()
  @IsString()
  note?: string;
}
