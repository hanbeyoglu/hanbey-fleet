import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ExpenseCategory, ShiftStatus } from '@hanbey-fleet/shared';

export class ExpenseVehicleSummaryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  plate: string;
}

export class ExpenseShiftSummaryDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: ShiftStatus })
  status: ShiftStatus;
}

export class ExpenseResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  vehicleId: string;

  @ApiPropertyOptional()
  shiftId?: string | null;

  @ApiProperty({ enum: ExpenseCategory })
  category: ExpenseCategory;

  @ApiProperty({ example: 500.0 })
  amount: number;

  @ApiProperty()
  expenseDate: Date;

  @ApiPropertyOptional()
  note?: string | null;

  @ApiPropertyOptional()
  receiptUrl?: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional({ type: ExpenseVehicleSummaryDto })
  vehicle?: ExpenseVehicleSummaryDto;

  @ApiPropertyOptional({ type: ExpenseShiftSummaryDto })
  shift?: ExpenseShiftSummaryDto | null;
}
