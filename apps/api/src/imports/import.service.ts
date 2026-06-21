import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { JwtPayload } from '@hanbey-fleet/shared';
import { ImportRepository } from './import.repository';
import { ParserService } from './parser.service';
import { ShiftsRepository } from '../shifts/shifts.repository';
import { DriverReportsRepository } from '../driver-reports/driver-reports.repository';
import { TimelineRepository } from '../timeline/timeline.repository';
import { FleetScopeService } from '../common/fleet/fleet-scope.service';
import { CreateImportDto } from './dto/create-import.dto';
import { OcrImportDto, WhatsAppImportDto } from './dto/source-import.dto';
import { ImportListQueryDto } from './dto/import-list-query.dto';
import { ImportResponseDto } from './dto/import-response.dto';
import { ImportMapper } from './mappers/import.mapper';
import {
  DriverReportSource,
  ImportSource,
  ImportStatus,
  PaginatedResponse,
  TimelineEventType,
} from '@hanbey-fleet/shared';

export const DEFAULT_IMPORT_ARCHIVE_DAYS = 90;

@Injectable()
export class ImportService {
  constructor(
    private repo: ImportRepository,
    private parser: ParserService,
    private shiftsRepo: ShiftsRepository,
    private driverReportsRepo: DriverReportsRepository,
    private timelineRepo: TimelineRepository,
    private fleetScope: FleetScopeService,
  ) {}

  importManual(user: JwtPayload, dto: CreateImportDto): Promise<ImportResponseDto> {
    return this.processImport(user, ImportSource.MANUAL, dto.rawContent.trim());
  }

  importOcr(user: JwtPayload, dto: OcrImportDto): Promise<ImportResponseDto> {
    return this.processImport(user, ImportSource.OCR, dto.text.trim());
  }

  importWhatsApp(user: JwtPayload, dto: WhatsAppImportDto): Promise<ImportResponseDto> {
    const rawContent = JSON.stringify({
      message: dto.message.trim(),
      sender: dto.sender ?? null,
      receivedAt: dto.receivedAt ?? new Date().toISOString(),
    });
    return this.processImport(user, ImportSource.WHATSAPP, rawContent);
  }

  async findAll(user: JwtPayload, query: ImportListQueryDto): Promise<PaginatedResponse<ImportResponseDto>> {
    const scope = this.fleetScope.resolve(user);
    const { data, total, page, limit } = await this.repo.findMany(query, scope.fleetOwnerId);

    return ImportMapper.toPaginatedResponse(data, {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    });
  }

  async findOne(user: JwtPayload, id: string): Promise<ImportResponseDto> {
    const scope = this.fleetScope.resolve(user);
    const job = await this.repo.findById(id, scope.fleetOwnerId);
    if (!job) throw new NotFoundException(`Import job ${id} not found`);
    return ImportMapper.toResponse(job);
  }

  async archiveOldCompletedImports(
    retentionDays: number = DEFAULT_IMPORT_ARCHIVE_DAYS,
  ): Promise<number> {
    const result = await this.repo.softDeleteCompletedOlderThan(retentionDays);
    return result.count;
  }

  private async processImport(
    user: JwtPayload,
    source: ImportSource,
    rawContent: string,
  ): Promise<ImportResponseDto> {
    const scope = this.fleetScope.resolve(user);
    const job = await this.repo.create({
      source,
      status: ImportStatus.PROCESSING,
      rawContent,
    });

    const textToParse = this.extractParseableText(rawContent, source);
    const parseResult = this.parser.parse(textToParse);

    await this.repo.update(job.id, {
      parsedContent: (parseResult.data ?? undefined) as Prisma.InputJsonValue | undefined,
    });

    if (!parseResult.success || !parseResult.data) {
      const failed = await this.repo.update(job.id, {
        status: ImportStatus.FAILED,
        error: parseResult.error ?? 'Parsing failed',
      });
      return ImportMapper.toResponse(failed);
    }

    const { shiftId, declaredRevenue, declaredHgs, declaredTotal, notes } =
      parseResult.data;

    const shift = await this.shiftsRepo.findCompletedById(shiftId!, scope.fleetOwnerId);
    if (!shift) {
      const failed = await this.repo.update(job.id, {
        status: ImportStatus.FAILED,
        error: `Shift ${shiftId} not found or is not COMPLETED`,
      });
      return ImportMapper.toResponse(failed);
    }

    if (shift.driverReport) {
      await this.repo.update(job.id, {
        status: ImportStatus.FAILED,
        error: 'A driver report already exists for this shift',
      });
      throw new ConflictException('A driver report already exists for this shift');
    }

    const driverReportSource = this.mapSourceToDriverReportSource(source);
    const vehiclePlate = shift.vehicle?.plate ?? shift.vehicleId;

    const completed = await this.repo.runInTransaction(async (tx) => {
      const report = await this.driverReportsRepo.create(
        {
          shiftId: shiftId!,
          source: driverReportSource,
          rawMessage: rawContent,
          declaredRevenue: declaredRevenue!,
          declaredHgs: declaredHgs!,
          declaredTotal: declaredTotal!,
          notes,
        },
        tx,
      );

      await this.timelineRepo.create(
        {
          vehicleId: shift.vehicleId,
          shiftId: shift.id,
          eventType: TimelineEventType.DRIVER_REPORT_IMPORTED,
          description: `Driver declaration imported via ${source} for vehicle ${vehiclePlate}`,
          metadata: {
            importJobId: job.id,
            driverReportId: report.id,
            shiftId: shift.id,
            source,
            declaredRevenue,
            declaredHgs,
            declaredTotal,
          },
        },
        tx,
      );

      return this.repo.complete(job.id, report.id, tx);
    });

    return ImportMapper.toResponse(completed);
  }

  private extractParseableText(rawContent: string, source: ImportSource): string {
    if (source !== ImportSource.WHATSAPP) {
      return rawContent;
    }

    try {
      const payload = JSON.parse(rawContent) as { message?: string };
      return payload.message?.trim() || rawContent;
    } catch {
      return rawContent;
    }
  }

  private mapSourceToDriverReportSource(source: ImportSource): DriverReportSource {
    switch (source) {
      case ImportSource.WHATSAPP:
        return DriverReportSource.WHATSAPP;
      case ImportSource.OCR:
        return DriverReportSource.OCR;
      default:
        return DriverReportSource.MANUAL;
    }
  }
}
