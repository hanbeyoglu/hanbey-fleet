import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSettlementDto {
  @ApiProperty({ description: 'Approved driver report to reconcile' })
  @IsUUID()
  driverReportId: string;
}
