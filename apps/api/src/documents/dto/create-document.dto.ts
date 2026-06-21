import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  DocumentType,
  OwnerType,
  DRIVER_DOCUMENT_TYPES,
  VEHICLE_DOCUMENT_TYPES,
} from '@hanbey-fleet/shared';

export class DocumentFileMetadataDto {
  @ApiProperty({ example: 'insurance-policy-2026.pdf' })
  @IsString()
  @MinLength(1)
  fileName: string;

  @ApiProperty({ example: 'https://storage.example.com/docs/insurance-policy-2026.pdf' })
  @IsString()
  @MinLength(1)
  fileUrl: string;

  @ApiProperty({ example: 'application/pdf' })
  @IsString()
  @MinLength(1)
  mimeType: string;

  @ApiProperty({ example: 245760 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  size: number;
}

export class CreateDocumentDto extends DocumentFileMetadataDto {
  @ApiProperty({ enum: OwnerType })
  @IsEnum(OwnerType)
  ownerType: OwnerType;

  @ApiProperty()
  @IsUUID()
  ownerId: string;

  @ApiProperty({ example: 'Vehicle Insurance Policy' })
  @IsString()
  @MinLength(1)
  title: string;

  @ApiProperty({ enum: DocumentType })
  @IsEnum(DocumentType)
  type: DocumentType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  issueDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  expiryDate?: string;
}

export class UpdateDocumentDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  title?: string;

  @ApiPropertyOptional({ enum: DocumentType })
  @IsOptional()
  @IsEnum(DocumentType)
  type?: DocumentType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  issueDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  expiryDate?: string;
}

export class CreateDocumentRevisionDto extends DocumentFileMetadataDto {}

export function isDocumentTypeAllowedForOwner(
  ownerType: OwnerType,
  type: DocumentType,
): boolean {
  const allowed =
    ownerType === OwnerType.VEHICLE ? VEHICLE_DOCUMENT_TYPES : DRIVER_DOCUMENT_TYPES;
  return allowed.includes(type);
}
