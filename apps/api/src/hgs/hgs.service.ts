import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { HgsRepository } from './hgs.repository';
import { VehiclesRepository } from '../vehicles/vehicles.repository';
import { ShiftsRepository } from '../shifts/shifts.repository';
import { TimelineService } from '../timeline/timeline.service';
import { SyncHgsDto } from './dto/sync-hgs.dto';
import { HgsListQueryDto } from './dto/hgs-list-query.dto';
import { HgsTransitResponseDto } from './dto/hgs-transit-response.dto';
import { SyncResultDto } from './dto/sync-result.dto';
import { HgsMapper } from './mappers/hgs.mapper';
import { TimelineEventType, PaginatedResponse } from '@hanbey-fleet/shared';

type SyncOutcome = 'skipped' | 'duplicates' | 'vehicleNotFound' | 'matchedShift' | 'unmatchedShift';

interface ValidatedSyncRecord {
  referenceNo: string;
  vehiclePlate: string;
  transitTime: string;
  tollBooth: string;
  amount: number;
  provider?: string;
}

@Injectable()
export class HgsService {
  private readonly logger = new Logger(HgsService.name);

  constructor(
    private repo: HgsRepository,
    private vehiclesRepo: VehiclesRepository,
    private shiftsRepo: ShiftsRepository,
    private timeline: TimelineService,
  ) {}

  async findAll(query: HgsListQueryDto): Promise<PaginatedResponse<HgsTransitResponseDto>> {
    const { data, total, page, limit } = await this.repo.findMany(query);

    return HgsMapper.toPaginatedResponse(data, {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    });
  }

  async findOne(id: string): Promise<HgsTransitResponseDto> {
    const transit = await this.repo.findById(id);
    if (!transit) throw new NotFoundException(`HGS transit ${id} not found`);
    return HgsMapper.toResponse(transit);
  }

  async sync(records: SyncHgsDto[]): Promise<SyncResultDto> {
    const result: SyncResultDto = {
      imported: 0,
      skipped: 0,
      duplicates: 0,
      vehicleNotFound: 0,
      matchedShift: 0,
      unmatchedShift: 0,
    };

    if (!records.length) {
      return result;
    }

    const vehiclePlateMap = await this.buildVehiclePlateMap();
    const seenReferenceNos = new Set<string>();

    const validReferenceNos = records
      .map((r) => r.referenceNo?.trim())
      .filter((ref): ref is string => Boolean(ref));

    const existingRefs = new Set(
      (await this.repo.findExistingReferenceNos(validReferenceNos))
        .map((r) => r.referenceNo)
        .filter((ref): ref is string => Boolean(ref)),
    );

    for (const record of records) {
      try {
        const outcome = await this.processSyncRecord(
          record,
          vehiclePlateMap,
          seenReferenceNos,
          existingRefs,
        );
        this.applySyncOutcome(result, outcome);
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002'
        ) {
          result.duplicates++;
        } else {
          this.logger.warn(
            `HGS sync record failed for reference ${record.referenceNo}: ${error instanceof Error ? error.message : error}`,
          );
          result.skipped++;
        }
      }
    }

    return result;
  }

  private async processSyncRecord(
    record: SyncHgsDto,
    vehiclePlateMap: Map<string, { id: string; plate: string }>,
    seenReferenceNos: Set<string>,
    existingRefs: Set<string>,
  ): Promise<SyncOutcome> {
    const validated = this.validateRecord(record);
    if (!validated) {
      return 'skipped';
    }

    const { referenceNo } = validated;

    if (seenReferenceNos.has(referenceNo) || existingRefs.has(referenceNo)) {
      return 'duplicates';
    }

    const vehicle = vehiclePlateMap.get(this.normalizePlate(validated.vehiclePlate));
    if (!vehicle) {
      return 'vehicleNotFound';
    }

    const transitTime = new Date(validated.transitTime);
    seenReferenceNos.add(referenceNo);

    const shift = await this.shiftsRepo.findMatchingShiftForTransit(vehicle.id, transitTime);
    const syncedAt = new Date();

    await this.repo.runInTransaction(async (tx) => {
      const transit = await this.repo.create(
        {
          vehicleId: vehicle.id,
          shiftId: shift?.id,
          transitTime,
          tollBooth: validated.tollBooth,
          amount: validated.amount,
          provider: validated.provider,
          referenceNo,
          rawData: record as unknown as Record<string, unknown>,
          syncedAt,
        },
        tx,
      );

      await this.timeline.create(
        {
          vehicleId: vehicle.id,
          shiftId: shift?.id,
          eventType: TimelineEventType.HGS_IMPORTED,
          description: `HGS transit imported for vehicle ${vehicle.plate}: ${validated.tollBooth} — ${validated.amount} TL`,
          metadata: {
            hgsTransitId: transit.id,
            referenceNo,
            tollBooth: validated.tollBooth,
            amount: validated.amount,
            provider: validated.provider ?? null,
            shiftId: shift?.id ?? null,
          },
        },
        tx,
      );
    });

    existingRefs.add(referenceNo);

    return shift ? 'matchedShift' : 'unmatchedShift';
  }

  private applySyncOutcome(result: SyncResultDto, outcome: SyncOutcome) {
    switch (outcome) {
      case 'matchedShift':
        result.imported++;
        result.matchedShift++;
        break;
      case 'unmatchedShift':
        result.imported++;
        result.unmatchedShift++;
        break;
      default:
        result[outcome]++;
    }
  }

  private async buildVehiclePlateMap() {
    const vehicles = await this.vehiclesRepo.findAllActivePlates();
    const map = new Map<string, { id: string; plate: string }>();

    for (const vehicle of vehicles) {
      map.set(this.normalizePlate(vehicle.plate), vehicle);
    }

    return map;
  }

  private validateRecord(record: SyncHgsDto): ValidatedSyncRecord | null {
    if (!this.isValidRecord(record)) {
      return null;
    }

    return {
      referenceNo: record.referenceNo!.trim(),
      vehiclePlate: record.vehiclePlate!.trim(),
      transitTime: record.transitTime!.trim(),
      tollBooth: record.tollBooth!.trim(),
      amount: record.amount!,
      provider: record.provider?.trim(),
    };
  }

  private isValidRecord(record: SyncHgsDto): boolean {
    if (!record.referenceNo?.trim()) return false;
    if (!record.vehiclePlate?.trim()) return false;
    if (!record.tollBooth?.trim()) return false;
    if (record.amount === undefined || record.amount === null || record.amount <= 0) return false;
    if (!record.transitTime?.trim()) return false;

    const transitTime = new Date(record.transitTime);
    return !Number.isNaN(transitTime.getTime());
  }

  private normalizePlate(plate: string): string {
    return plate.replace(/\s+/g, '').toUpperCase();
  }
}
