import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { JwtPayload } from '@hanbey-fleet/shared';
import { DocumentsRepository } from './documents.repository';
import { VehiclesRepository } from '../vehicles/vehicles.repository';
import { DriversRepository } from '../drivers/drivers.repository';
import { TimelineService } from '../timeline/timeline.service';
import { NotificationsService } from '../notifications/notifications.service';
import { FleetScopeService } from '../common/fleet/fleet-scope.service';
import {
  CreateDocumentDto,
  CreateDocumentRevisionDto,
  UpdateDocumentDto,
  isDocumentTypeAllowedForOwner,
} from './dto/create-document.dto';
import { DocumentListQueryDto } from './dto/document-list-query.dto';
import {
  DocumentResponseDto,
  ExpiredDocumentSummaryDto,
} from './dto/document-response.dto';
import { DocumentMapper } from './mappers/document.mapper';
import { computeDocumentStatus } from './utils/document-status.util';
import {
  DOCUMENT_EXPIRING_THRESHOLD_DAYS,
  DocumentStatus,
  DocumentType,
  NotificationType,
  OwnerType,
  PaginatedResponse,
  TimelineEventType,
} from '@hanbey-fleet/shared';

@Injectable()
export class DocumentsService {
  constructor(
    private repo: DocumentsRepository,
    private vehiclesRepo: VehiclesRepository,
    private driversRepo: DriversRepository,
    private timeline: TimelineService,
    private notifications: NotificationsService,
    private fleetScope: FleetScopeService,
  ) {}

  async findAll(
    user: JwtPayload,
    query: DocumentListQueryDto,
  ): Promise<PaginatedResponse<DocumentResponseDto>> {
    const scope = this.fleetScope.resolve(user);
    const { data, total, page, limit } = await this.repo.findMany(query, scope.fleetOwnerId);
    const enriched = await this.enrichOwnerLabels(data, scope.fleetOwnerId);

    return DocumentMapper.toPaginatedResponse(enriched, {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    });
  }

  async findOne(user: JwtPayload, id: string): Promise<DocumentResponseDto> {
    const scope = this.fleetScope.resolve(user);
    const document = await this.repo.findById(id, undefined, scope.fleetOwnerId);
    if (!document) throw new NotFoundException(`Document ${id} not found`);

    const [enriched] = await this.enrichOwnerLabels([document], scope.fleetOwnerId);
    return DocumentMapper.toResponse(enriched);
  }

  async create(user: JwtPayload, dto: CreateDocumentDto): Promise<DocumentResponseDto> {
    const scope = this.fleetScope.resolve(user);
    await this.assertOwnerExists(dto.ownerType, dto.ownerId, scope.fleetOwnerId);
    this.assertDocumentType(dto.ownerType, dto.type);

    const issueDate = dto.issueDate ? this.parseDate(dto.issueDate, 'issueDate') : undefined;
    const expiryDate = dto.expiryDate ? this.parseDate(dto.expiryDate, 'expiryDate') : undefined;
    this.assertDateOrder(issueDate, expiryDate);

    const documentId = await this.repo.runInTransaction(async (tx) => {
      const document = await this.repo.createDocument(
        {
          ownerType: dto.ownerType,
          ownerId: dto.ownerId,
          title: dto.title.trim(),
          type: dto.type,
          issueDate,
          expiryDate,
        },
        tx,
      );

      await this.repo.createRevision(
        {
          documentId: document.id,
          version: 1,
          fileName: dto.fileName.trim(),
          fileUrl: dto.fileUrl.trim(),
          mimeType: dto.mimeType.trim(),
          size: dto.size,
        },
        tx,
      );

      return document.id;
    });

    const created = await this.repo.findById(documentId, undefined, scope.fleetOwnerId);
    if (!created) throw new NotFoundException('Document could not be loaded after creation');

    const [enriched] = await this.enrichOwnerLabels([created!], scope.fleetOwnerId);
    const response = DocumentMapper.toResponse(enriched);

    await this.createTimelineEvent(
      enriched,
      TimelineEventType.DOCUMENT_UPLOADED,
      `Document uploaded: ${enriched.title}`,
      { documentId: enriched.id, version: 1 },
    );
    await this.notifyIfExpiring(enriched, scope.fleetOwnerId);

    return response;
  }

  async update(user: JwtPayload, id: string, dto: UpdateDocumentDto): Promise<DocumentResponseDto> {
    const scope = this.fleetScope.resolve(user);
    const existing = await this.repo.findById(id, undefined, scope.fleetOwnerId);
    if (!existing) throw new NotFoundException(`Document ${id} not found`);

    if (dto.type) {
      this.assertDocumentType(existing.ownerType as OwnerType, dto.type);
    }

    const issueDate =
      dto.issueDate !== undefined
        ? dto.issueDate
          ? this.parseDate(dto.issueDate, 'issueDate')
          : null
        : undefined;
    const expiryDate =
      dto.expiryDate !== undefined
        ? dto.expiryDate
          ? this.parseDate(dto.expiryDate, 'expiryDate')
          : null
        : undefined;

    const nextIssueDate = issueDate !== undefined ? issueDate : existing.issueDate;
    const nextExpiryDate = expiryDate !== undefined ? expiryDate : existing.expiryDate;
    this.assertDateOrder(nextIssueDate, nextExpiryDate);

    const updated = await this.repo.update(id, {
      ...(dto.title && { title: dto.title.trim() }),
      ...(dto.type && { type: dto.type }),
      ...(issueDate !== undefined && { issueDate }),
      ...(expiryDate !== undefined && { expiryDate }),
    });

    const [enriched] = await this.enrichOwnerLabels([updated], scope.fleetOwnerId);
    await this.notifyIfExpiring(enriched as typeof updated, scope.fleetOwnerId);

    return DocumentMapper.toResponse(enriched as typeof updated);
  }

  async createNewVersion(
    user: JwtPayload,
    id: string,
    dto: CreateDocumentRevisionDto,
  ): Promise<DocumentResponseDto> {
    const scope = this.fleetScope.resolve(user);
    const existing = await this.repo.findById(id, undefined, scope.fleetOwnerId);
    if (!existing) throw new NotFoundException(`Document ${id} not found`);

    await this.repo.runInTransaction(async (tx) => {
      const latest = await this.repo.getLatestVersion(id, tx);
      const nextVersion = (latest?.version ?? 0) + 1;

      await this.repo.createRevision(
        {
          documentId: id,
          version: nextVersion,
          fileName: dto.fileName.trim(),
          fileUrl: dto.fileUrl.trim(),
          mimeType: dto.mimeType.trim(),
          size: dto.size,
        },
        tx,
      );
    });

    const updated = await this.repo.findById(id, undefined, scope.fleetOwnerId);
    if (!updated) throw new NotFoundException(`Document ${id} not found`);

    const [enriched] = await this.enrichOwnerLabels([updated], scope.fleetOwnerId);
    const latestVersion = enriched.revisions[0]?.version ?? 1;

    await this.createTimelineEvent(
      enriched,
      TimelineEventType.DOCUMENT_REPLACED,
      `Document replaced: ${enriched.title} (v${latestVersion})`,
      { documentId: enriched.id, version: latestVersion },
    );

    return DocumentMapper.toResponse(enriched);
  }

  async softDelete(user: JwtPayload, id: string): Promise<DocumentResponseDto> {
    const scope = this.fleetScope.resolve(user);
    const existing = await this.repo.findById(id, undefined, scope.fleetOwnerId);
    if (!existing) throw new NotFoundException(`Document ${id} not found`);

    const deleted = await this.repo.softDelete(id);
    const [enriched] = await this.enrichOwnerLabels([deleted], scope.fleetOwnerId);

    await this.createTimelineEvent(
      enriched,
      TimelineEventType.DOCUMENT_DELETED,
      `Document deleted: ${enriched.title}`,
      { documentId: enriched.id },
    );

    return DocumentMapper.toResponse(enriched);
  }

  async getExpiredForDashboard(limit = 10, fleetOwnerId?: string | null): Promise<ExpiredDocumentSummaryDto[]> {
    const documents = await this.repo.findExpired(limit, fleetOwnerId);
    const enriched = await this.enrichOwnerLabels(documents, fleetOwnerId);
    return enriched
      .filter((doc) => doc.expiryDate)
      .map(DocumentMapper.toExpiredSummary);
  }

  async getComplianceCounts(fleetOwnerId?: string | null): Promise<{ expired: number; expiring: number }> {
    const counts = await this.repo.countByStatus(new Date(), fleetOwnerId);
    return { expired: counts.expired, expiring: counts.expiring };
  }

  async checkExpiringDocuments(): Promise<number> {
    const documents = await this.repo.findExpiring(DOCUMENT_EXPIRING_THRESHOLD_DAYS);
    const enriched = await this.enrichOwnerLabels(documents);
    let notified = 0;

    for (const document of enriched) {
      if (computeDocumentStatus(document.expiryDate) === DocumentStatus.EXPIRING) {
        await this.notifyIfExpiring(document);
        notified++;
      }
    }

    return notified;
  }

  private async notifyIfExpiring(
    document: Awaited<ReturnType<DocumentsRepository['findById']>> & {
      ownerLabel?: string | null;
    },
    fleetOwnerId?: string | null,
  ): Promise<void> {
    if (!document?.expiryDate) return;
    if (computeDocumentStatus(document.expiryDate) !== DocumentStatus.EXPIRING) return;
    if (!fleetOwnerId) return;

    const ownerLabel = document.ownerLabel ?? document.ownerId;
    const daysLeft = Math.ceil(
      (document.expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
    );

    await this.notifications.notifyFleetManagers(fleetOwnerId, {
      type: NotificationType.DOCUMENT_EXPIRING,
      title: 'Document expiring soon',
      message: `${document.title} for ${ownerLabel} expires in ${daysLeft} day(s).`,
      referenceId: document.id,
      referenceType: 'document',
      metadata: {
        documentId: document.id,
        ownerType: document.ownerType,
        ownerId: document.ownerId,
        ownerLabel,
        documentType: document.type,
        expiryDate: document.expiryDate.toISOString(),
        daysLeft,
      },
    });
  }

  private async createTimelineEvent(
    document: NonNullable<Awaited<ReturnType<DocumentsRepository['findById']>>>,
    eventType: TimelineEventType,
    description: string,
    metadata: Record<string, unknown>,
  ): Promise<void> {
    const vehicleId = await this.resolveTimelineVehicleId(
      document.ownerType as OwnerType,
      document.ownerId,
    );
    if (!vehicleId) return;

    await this.timeline.create({
      vehicleId,
      eventType,
      description,
      metadata: {
        ...metadata,
        ownerType: document.ownerType,
        ownerId: document.ownerId,
        documentType: document.type,
      },
    });
  }

  private async resolveTimelineVehicleId(
    ownerType: OwnerType,
    ownerId: string,
  ): Promise<string | null> {
    if (ownerType === OwnerType.VEHICLE) {
      return ownerId;
    }

    const shift = await this.repo.findLatestShiftVehicleForDriver(ownerId);
    return shift?.vehicleId ?? null;
  }

  private async assertOwnerExists(
    ownerType: OwnerType,
    ownerId: string,
    fleetOwnerId?: string | null,
  ): Promise<void> {
    if (ownerType === OwnerType.VEHICLE) {
      const vehicle = await this.vehiclesRepo.findById(ownerId, fleetOwnerId);
      if (!vehicle) throw new NotFoundException(`Vehicle ${ownerId} not found`);
      return;
    }

    const driver = await this.driversRepo.findById(ownerId, fleetOwnerId);
    if (!driver) throw new NotFoundException(`Driver ${ownerId} not found`);
  }

  private assertDocumentType(ownerType: OwnerType, type: DocumentType): void {
    if (!isDocumentTypeAllowedForOwner(ownerType, type)) {
      throw new BadRequestException(`Document type ${type} is not allowed for ${ownerType}`);
    }
  }

  private async enrichOwnerLabels<T extends { ownerType: string; ownerId: string }>(
    documents: T[],
    fleetOwnerId?: string | null,
  ): Promise<Array<T & { ownerLabel?: string | null }>> {
    const vehicleIds = [
      ...new Set(
        documents.filter((d) => d.ownerType === OwnerType.VEHICLE).map((d) => d.ownerId),
      ),
    ];
    const driverIds = [
      ...new Set(
        documents.filter((d) => d.ownerType === OwnerType.DRIVER).map((d) => d.ownerId),
      ),
    ];

    const [vehicles, drivers] = await Promise.all([
      Promise.all(vehicleIds.map((id) => this.vehiclesRepo.findById(id, fleetOwnerId))),
      Promise.all(driverIds.map((id) => this.driversRepo.findById(id, fleetOwnerId))),
    ]);

    const vehicleLabels = new Map(
      vehicles.filter(Boolean).map((v) => [v!.id, v!.plate]),
    );
    const driverLabels = new Map(
      drivers.filter(Boolean).map((d) => [d!.id, d!.user.name]),
    );

    return documents.map((document) => ({
      ...document,
      ownerLabel:
        document.ownerType === OwnerType.VEHICLE
          ? vehicleLabels.get(document.ownerId) ?? null
          : driverLabels.get(document.ownerId) ?? null,
    }));
  }

  private parseDate(value: string, field: string): Date {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException(`Invalid ${field}`);
    }
    return date;
  }

  private assertDateOrder(issueDate?: Date | null, expiryDate?: Date | null): void {
    if (issueDate && expiryDate && expiryDate < issueDate) {
      throw new BadRequestException('expiryDate cannot be before issueDate');
    }
  }
}
