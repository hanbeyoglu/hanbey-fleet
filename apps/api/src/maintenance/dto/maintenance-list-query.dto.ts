import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { MaintenanceSortField } from '@hanbey-fleet/shared';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class MaintenanceListQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  vehicleId?: string;

  @ApiPropertyOptional({ example: 'Toyota Yetkili Servis' })
  @IsOptional()
  @IsString()
  serviceProvider?: string;

  @ApiPropertyOptional({ example: '2024-06-01T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2024-06-30T23:59:59.999Z' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Search in description, service provider and notes' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: MaintenanceSortField, default: MaintenanceSortField.DATE })
  @IsOptional()
  @IsEnum(MaintenanceSortField)
  sortBy?: MaintenanceSortField = MaintenanceSortField.DATE;
}
