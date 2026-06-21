import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { JwtPayload } from '@hanbey-fleet/shared';
import { TimelineRepository } from './timeline.repository';
import { VehiclesRepository } from '../vehicles/vehicles.repository';
import { FleetScopeService } from '../common/fleet/fleet-scope.service';
import { CreateTimelineEventDto } from './dto/create-timeline-event.dto';

@Injectable()
export class TimelineService {
  constructor(
    private repo: TimelineRepository,
    private vehiclesRepo: VehiclesRepository,
    private fleetScope: FleetScopeService,
  ) {}

  create(dto: CreateTimelineEventDto, tx?: Prisma.TransactionClient) {
    return this.repo.create(dto, tx);
  }

  async findByVehicle(user: JwtPayload, vehicleId: string, limit?: number) {
    const scope = this.fleetScope.resolve(user);
    const vehicle = await this.vehiclesRepo.findById(vehicleId, scope.fleetOwnerId);
    if (!vehicle) throw new NotFoundException(`Vehicle ${vehicleId} not found`);
    return this.repo.findByVehicle(vehicleId, limit, scope.fleetOwnerId);
  }

  findAll(user: JwtPayload) {
    const scope = this.fleetScope.resolve(user);
    return this.repo.findAll(scope.fleetOwnerId);
  }

  findRecent(limit: number, user?: JwtPayload) {
    const scope = user ? this.fleetScope.resolve(user) : { fleetOwnerId: null, isGlobal: true };
    return this.repo.findRecent(limit, scope.fleetOwnerId);
  }
}
