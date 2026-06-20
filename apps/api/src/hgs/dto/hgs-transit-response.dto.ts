import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class HgsVehicleSummaryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  plate: string;

  @ApiPropertyOptional()
  hgsTag?: string | null;
}

export class HgsShiftSummaryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  status: string;
}

export class HgsTransitResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  vehicleId: string;

  @ApiPropertyOptional()
  shiftId?: string | null;

  @ApiProperty()
  transitTime: Date;

  @ApiProperty()
  tollBooth: string;

  @ApiProperty({ example: 125.5 })
  amount: number;

  @ApiPropertyOptional()
  provider?: string | null;

  @ApiPropertyOptional()
  referenceNo?: string | null;

  @ApiPropertyOptional()
  syncedAt?: Date | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional({ type: HgsVehicleSummaryDto })
  vehicle?: HgsVehicleSummaryDto;

  @ApiPropertyOptional({ type: HgsShiftSummaryDto })
  shift?: HgsShiftSummaryDto | null;
}
