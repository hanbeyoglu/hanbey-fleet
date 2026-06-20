import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { ExpenseCategory, ExpenseSortField } from '@hanbey-fleet/shared';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class ExpenseListQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: ExpenseCategory })
  @IsOptional()
  @IsEnum(ExpenseCategory)
  category?: ExpenseCategory;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  vehicleId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  shiftId?: string;

  @ApiPropertyOptional({ example: '2024-06-01T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2024-06-30T23:59:59.999Z' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Search in expense note' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: ExpenseSortField, default: ExpenseSortField.EXPENSE_DATE })
  @IsOptional()
  @IsEnum(ExpenseSortField)
  sortBy?: ExpenseSortField = ExpenseSortField.EXPENSE_DATE;
}
