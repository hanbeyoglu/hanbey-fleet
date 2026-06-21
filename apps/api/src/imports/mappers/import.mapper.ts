import { ImportJob } from '@prisma/client';
import { ImportResponseDto } from '../dto/import-response.dto';
import { ImportSource, ImportStatus, PaginatedResponse, PaginationMeta } from '@hanbey-fleet/shared';
import { ParsedImportContent } from '../parser.service';

export class ImportMapper {
  static toResponse(job: ImportJob): ImportResponseDto {
    return {
      id: job.id,
      source: job.source as ImportSource,
      status: job.status as ImportStatus,
      rawContent: job.rawContent,
      parsedContent: job.parsedContent as ParsedImportContent | null,
      driverReportId: job.driverReportId,
      error: job.error,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
    };
  }

  static toPaginatedResponse(
    jobs: ImportJob[],
    meta: PaginationMeta,
  ): PaginatedResponse<ImportResponseDto> {
    return {
      data: jobs.map(ImportMapper.toResponse),
      meta,
    };
  }
}
