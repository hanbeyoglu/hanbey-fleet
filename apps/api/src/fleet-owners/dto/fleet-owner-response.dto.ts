import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class FleetOwnerResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  phone: string;

  @ApiPropertyOptional()
  email: string | null;

  @ApiPropertyOptional()
  address: string | null;

  @ApiPropertyOptional()
  taxNumber: string | null;

  @ApiProperty()
  vehicleCount: number;

  @ApiProperty()
  memberCount: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class FleetOwnerSummaryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  phone: string;

  @ApiPropertyOptional()
  email: string | null;
}
