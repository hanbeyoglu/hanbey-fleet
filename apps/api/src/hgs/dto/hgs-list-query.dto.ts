import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { HgsSortField } from '@hanbey-fleet/shared';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class HgsListQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  vehicleId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  shiftId?: string;

  @ApiPropertyOptional({ example: 'ISBANK' })
  @IsOptional()
  @IsString()
  provider?: string;

  @ApiPropertyOptional({ example: '2024-06-01T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2024-06-30T23:59:59.999Z' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Search in toll booth, reference number or provider' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: HgsSortField, default: HgsSortField.TRANSIT_TIME })
  @IsOptional()
  @IsEnum(HgsSortField)
  sortBy?: HgsSortField = HgsSortField.TRANSIT_TIME;
}
