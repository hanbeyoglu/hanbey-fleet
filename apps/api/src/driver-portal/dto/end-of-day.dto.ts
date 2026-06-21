import {
  IsEnum,
  IsOptional,
  IsString,
  IsNumber,
  IsBoolean,
  IsInt,
  IsArray,
  ValidateNested,
  Min,
  ValidateIf,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ExpenseCategory } from '@hanbey-fleet/shared';
import { Type } from 'class-transformer';

export class EndOfDayExpenseDto {
  @ApiProperty({ enum: ExpenseCategory, example: ExpenseCategory.FUEL })
  @IsEnum(ExpenseCategory)
  category: ExpenseCategory;

  @ApiProperty({ example: 250 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount: number;

  @ApiPropertyOptional({ example: 'Yakıt' })
  @IsOptional()
  @IsString()
  note?: string;
}

export class EndOfDayDto {
  @ApiPropertyOptional({ example: 400, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  declaredHgs?: number;

  @ApiPropertyOptional({ example: 1000, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  posAmount?: number;

  @ApiPropertyOptional({ type: [EndOfDayExpenseDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EndOfDayExpenseDto)
  expenses?: EndOfDayExpenseDto[];

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  updateMileage?: boolean;

  @ApiPropertyOptional({ example: 185760 })
  @ValidateIf((o) => o.updateMileage === true)
  @Type(() => Number)
  @IsInt()
  @Min(0)
  closingMileage?: number;

  @ApiPropertyOptional({ example: 'Gün sonu' })
  @IsOptional()
  @IsString()
  notes?: string;
}
