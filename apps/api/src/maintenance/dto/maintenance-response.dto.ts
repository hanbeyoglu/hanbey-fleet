import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MaintenanceVehicleSummaryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  plate: string;

  @ApiProperty()
  brand: string;

  @ApiProperty()
  model: string;
}

export class MaintenanceExpenseSummaryDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ example: 850.0 })
  amount: number;

  @ApiProperty()
  expenseDate: Date;
}

export class MaintenanceResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  vehicleId: string;

  @ApiPropertyOptional()
  expenseId?: string | null;

  @ApiProperty()
  description: string;

  @ApiProperty({ example: 850.0 })
  cost: number;

  @ApiProperty()
  date: Date;

  @ApiPropertyOptional()
  mileage?: number | null;

  @ApiPropertyOptional()
  serviceProvider?: string | null;

  @ApiPropertyOptional()
  warrantyUntil?: Date | null;

  @ApiPropertyOptional()
  nextMaintenanceMileage?: number | null;

  @ApiPropertyOptional()
  notes?: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional({ type: MaintenanceVehicleSummaryDto })
  vehicle?: MaintenanceVehicleSummaryDto;

  @ApiPropertyOptional({ type: MaintenanceExpenseSummaryDto })
  expense?: MaintenanceExpenseSummaryDto | null;
}
