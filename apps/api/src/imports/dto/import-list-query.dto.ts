import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { ImportSource, ImportStatus } from '@hanbey-fleet/shared';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class ImportListQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: ImportStatus })
  @IsOptional()
  @IsEnum(ImportStatus)
  status?: ImportStatus;

  @ApiPropertyOptional({ enum: ImportSource })
  @IsOptional()
  @IsEnum(ImportSource)
  source?: ImportSource;
}
