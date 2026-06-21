import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DocumentStatus, DocumentType, OwnerType } from '@hanbey-fleet/shared';

export class DocumentRevisionResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  version: number;

  @ApiProperty()
  fileName: string;

  @ApiProperty()
  fileUrl: string;

  @ApiProperty()
  mimeType: string;

  @ApiProperty()
  size: number;

  @ApiProperty()
  createdAt: Date;
}

export class DocumentResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: OwnerType })
  ownerType: OwnerType;

  @ApiProperty()
  ownerId: string;

  @ApiPropertyOptional()
  ownerLabel?: string | null;

  @ApiProperty()
  title: string;

  @ApiProperty({ enum: DocumentType })
  type: DocumentType;

  @ApiPropertyOptional()
  issueDate?: Date | null;

  @ApiPropertyOptional()
  expiryDate?: Date | null;

  @ApiProperty({ enum: DocumentStatus })
  status: DocumentStatus;

  @ApiProperty({ type: DocumentRevisionResponseDto })
  currentRevision: DocumentRevisionResponseDto;

  @ApiProperty({ type: [DocumentRevisionResponseDto] })
  revisions: DocumentRevisionResponseDto[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class ExpiredDocumentSummaryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty({ enum: DocumentType })
  type: DocumentType;

  @ApiProperty({ enum: OwnerType })
  ownerType: OwnerType;

  @ApiProperty()
  ownerId: string;

  @ApiPropertyOptional()
  ownerLabel?: string | null;

  @ApiProperty()
  expiryDate: Date;

  @ApiProperty({ enum: DocumentStatus })
  status: DocumentStatus;
}
