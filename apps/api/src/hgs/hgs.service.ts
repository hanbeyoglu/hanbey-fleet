import { Injectable, NotFoundException, Logger, NotImplementedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HgsRepository } from './hgs.repository';
import { SyncHgsDto } from './dto/sync-hgs.dto';

@Injectable()
export class HgsService {
  private readonly logger = new Logger(HgsService.name);

  constructor(
    private repo: HgsRepository,
    private config: ConfigService,
  ) {}

  findAll(vehicleId?: string) {
    return this.repo.findAll(vehicleId);
  }

  async findOne(id: string) {
    const transit = await this.repo.findById(id);
    if (!transit) throw new NotFoundException(`HGS transit ${id} not found`);
    return transit;
  }

  /**
   * Stub for future İş Bankası HGS API integration.
   * Will call the bank API to fetch transit records for the given vehicle and date range,
   * then persist them using createMany with deduplication.
   */
  async syncFromBank(dto: SyncHgsDto): Promise<{ message: string; synced: number }> {
    const apiKey = this.config.get('HGS_API_KEY');
    const apiBaseUrl = this.config.get('HGS_API_BASE_URL');

    if (!apiKey || !apiBaseUrl) {
      throw new NotImplementedException(
        'HGS bank integration is not configured. Set HGS_API_KEY and HGS_API_BASE_URL in .env.',
      );
    }

    // TODO: Implement İş Bankası API call
    // const transits = await this.fetchBankTransits(dto);
    // const result = await this.repo.createMany(transits);
    // return { message: 'Sync completed', synced: result.count };

    this.logger.debug(`Sync requested for vehicle ${dto.vehicleId}`);
    throw new NotImplementedException('İş Bankası HGS API integration coming soon');
  }
}
