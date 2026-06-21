import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ImportSource, ImportStatus } from '@hanbey-fleet/shared';
import { ParsedImportContent } from '../parser.service';

export class ImportResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: ImportSource })
  source: ImportSource;

  @ApiProperty({ enum: ImportStatus })
  status: ImportStatus;

  @ApiProperty()
  rawContent: string;

  @ApiPropertyOptional()
  parsedContent?: ParsedImportContent | null;

  @ApiPropertyOptional()
  driverReportId?: string | null;

  @ApiPropertyOptional()
  error?: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
