import { IsUUID, IsDateString, IsNumber, IsOptional, IsString, IsEnum, IsPositive } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ExpenseCategory } from '@hanbey-fleet/shared';
import { Type } from 'class-transformer';

export class CreateExpenseDto {
  @ApiProperty()
  @IsUUID()
  vehicleId: string;

  @ApiProperty({ enum: ExpenseCategory })
  @IsEnum(ExpenseCategory)
  category: ExpenseCategory;

  @ApiProperty({ example: 500.0 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  amount: number;

  @ApiProperty({ example: '2024-06-20T00:00:00.000Z' })
  @IsDateString()
  expenseDate: string;

  @ApiPropertyOptional({ example: 'Fuel fill-up at Shell station' })
  @IsString()
  @IsOptional()
  note?: string;

  @ApiPropertyOptional({ example: 'https://storage.example.com/receipt-001.jpg' })
  @IsString()
  @IsOptional()
  receiptUrl?: string;
}
