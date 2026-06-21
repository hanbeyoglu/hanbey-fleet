import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { FleetOwnersRepository } from './fleet-owners.repository';
import { FleetScopeService } from '../common/fleet/fleet-scope.service';
import { CreateFleetOwnerDto } from './dto/create-fleet-owner.dto';
import { UpdateFleetOwnerDto } from './dto/update-fleet-owner.dto';
import { FindOrCreateFleetOwnerDto } from './dto/find-or-create-fleet-owner.dto';
import { FleetOwnerMapper } from './mappers/fleet-owner.mapper';
import { FleetOwnerResponseDto, FleetOwnerSummaryDto } from './dto/fleet-owner-response.dto';
import { Role, JwtPayload } from '@hanbey-fleet/shared';

@Injectable()
export class FleetOwnersService {
  constructor(
    private repo: FleetOwnersRepository,
    private fleetScope: FleetScopeService,
  ) {}

  async findAll(user: JwtPayload): Promise<FleetOwnerResponseDto[]> {
    const scope = this.fleetScope.resolve(user);
    const owners = scope.isGlobal
      ? await this.repo.findAll()
      : await this.repo.findByUserMemberships(scope.userId);
    return owners.map(FleetOwnerMapper.toResponse);
  }

  async findOne(user: JwtPayload, id: string): Promise<FleetOwnerResponseDto> {
    const scope = this.fleetScope.resolve(user);
    if (!scope.isGlobal) {
      const memberships = await this.repo.findByUserMemberships(scope.userId);
      if (!memberships.some((m) => m.id === id)) {
        throw new NotFoundException(`Fleet owner ${id} not found`);
      }
    }

    const owner = await this.repo.findById(id);
    if (!owner) throw new NotFoundException(`Fleet owner ${id} not found`);
    return FleetOwnerMapper.toResponse(owner);
  }

  async create(dto: CreateFleetOwnerDto): Promise<FleetOwnerResponseDto> {
    const existing = await this.repo.findByPhone(dto.phone);
    if (existing) {
      // BR-152: Fleet owner found by phone — return existing instead of duplicating
      throw new ConflictException(
        `A fleet owner with phone ${dto.phone} already exists. Use find-or-create endpoint instead.`,
      );
    }

    const owner = await this.repo.create(dto);
    return FleetOwnerMapper.toResponse(owner);
  }

  async update(id: string, dto: UpdateFleetOwnerDto): Promise<FleetOwnerResponseDto> {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundException(`Fleet owner ${id} not found`);

    if (dto.phone && dto.phone !== existing.phone) {
      const phoneConflict = await this.repo.findByPhone(dto.phone);
      if (phoneConflict) {
        throw new ConflictException(`Phone ${dto.phone} is already used by another fleet owner`);
      }
    }

    const owner = await this.repo.update(id, dto);
    return FleetOwnerMapper.toResponse(owner);
  }

  async remove(id: string): Promise<FleetOwnerResponseDto> {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundException(`Fleet owner ${id} not found`);

    const owner = await this.repo.softDelete(id);
    return FleetOwnerMapper.toResponse(owner);
  }

  // BR-152: Find by phone or create new fleet owner + user
  async findOrCreate(dto: FindOrCreateFleetOwnerDto): Promise<{
    owner: FleetOwnerSummaryDto;
    created: boolean;
  }> {
    const existing = await this.repo.findByPhone(dto.phone);
    if (existing) {
      return { owner: FleetOwnerMapper.toSummary(existing), created: false };
    }

    if (!dto.name) {
      throw new BadRequestException(
        'name is required when creating a new fleet owner (phone not found)',
      );
    }

    const owner = await this.repo.create({
      name: dto.name,
      phone: dto.phone,
      email: dto.email,
      address: dto.address,
      taxNumber: dto.taxNumber,
    });

    return { owner: FleetOwnerMapper.toSummary(owner), created: true };
  }

  async getMemberships(user: JwtPayload, fleetOwnerId: string) {
    await this.findOne(user, fleetOwnerId);
    return this.repo.findMemberships(fleetOwnerId);
  }

  // BR-155: Add user to fleet owner — creates membership if not exists
  async addMember(
    user: JwtPayload,
    fleetOwnerId: string,
    userId: string,
    role: Role,
  ) {
    await this.findOne(user, fleetOwnerId);

    const existing = await this.repo.findMembership(fleetOwnerId, userId);
    if (existing && existing.status === 'ACTIVE') {
      throw new ConflictException('User is already an active member of this fleet');
    }

    if (existing && existing.status === 'INACTIVE') {
      return this.repo.updateMembershipStatus(existing.id, 'ACTIVE');
    }

    return this.repo.createMembership({ fleetOwnerId, userId, role });
  }
}
