import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { SettlementSortField, SettlementStatus } from '@hanbey-fleet/shared';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class SettlementListQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: SettlementStatus })
  @IsOptional()
  @IsEnum(SettlementStatus)
  status?: SettlementStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  driverId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  vehicleId?: string;

  @ApiPropertyOptional({ example: '2024-06-01T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2024-06-30T23:59:59.999Z' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ enum: SettlementSortField, default: SettlementSortField.CREATED_AT })
  @IsOptional()
  @IsEnum(SettlementSortField)
  sortBy?: SettlementSortField = SettlementSortField.CREATED_AT;
}
