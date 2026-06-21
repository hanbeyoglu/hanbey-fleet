import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import {
  DocumentStatus,
  DocumentType,
  OwnerType,
  DocumentSortField,
} from '@hanbey-fleet/shared';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class DocumentListQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: OwnerType })
  @IsOptional()
  @IsEnum(OwnerType)
  ownerType?: OwnerType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  ownerId?: string;

  @ApiPropertyOptional({ enum: DocumentStatus })
  @IsOptional()
  @IsEnum(DocumentStatus)
  status?: DocumentStatus;

  @ApiPropertyOptional({ enum: DocumentType })
  @IsOptional()
  @IsEnum(DocumentType)
  type?: DocumentType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: DocumentSortField, default: DocumentSortField.CREATED_AT })
  @IsOptional()
  @IsEnum(DocumentSortField)
  sortBy?: DocumentSortField = DocumentSortField.CREATED_AT;
}
