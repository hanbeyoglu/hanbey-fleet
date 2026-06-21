import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { JwtPayload } from '@hanbey-fleet/shared';
import { DriversRepository } from './drivers.repository';
import { UsersRepository } from '../users/users.repository';
import { FleetScopeService } from '../common/fleet/fleet-scope.service';
import { CreateDriverDto } from './dto/create-driver.dto';
import { UpdateDriverDto } from './dto/update-driver.dto';

@Injectable()
export class DriversService {
  constructor(
    private repo: DriversRepository,
    private usersRepo: UsersRepository,
    private fleetScope: FleetScopeService,
  ) {}

  findAll(user: JwtPayload) {
    const scope = this.fleetScope.resolve(user);
    return this.repo.findAll(scope.fleetOwnerId);
  }

  async findOne(user: JwtPayload, id: string) {
    const scope = this.fleetScope.resolve(user);
    const driver = await this.repo.findById(id, scope.fleetOwnerId);
    if (!driver) throw new NotFoundException(`Driver ${id} not found`);
    return driver;
  }

  async create(user: JwtPayload, dto: CreateDriverDto) {
    const byUser = await this.repo.findByUserId(dto.userId);
    if (byUser) throw new ConflictException('User already has a driver profile');

    const byLicense = await this.repo.findByLicense(dto.licenseNo);
    if (byLicense) throw new ConflictException(`License number ${dto.licenseNo} already registered`);

    return this.repo.create(dto);
  }

  async update(user: JwtPayload, id: string, dto: UpdateDriverDto) {
    await this.findOne(user, id);

    if (dto.licenseNo) {
      const existing = await this.repo.findByLicense(dto.licenseNo);
      if (existing && existing.id !== id) {
        throw new ConflictException(`License number ${dto.licenseNo} already in use`);
      }
    }

    return this.repo.update(id, dto);
  }

  async remove(user: JwtPayload, id: string) {
    await this.findOne(user, id);
    return this.repo.softDelete(id);
  }

  // BR-154: Find driver by phone — prevents duplicate accounts
  async findByPhone(user: JwtPayload, phone: string) {
    const scope = this.fleetScope.resolve(user);
    const byDriverPhone = await this.repo.findByPhone(phone, scope.fleetOwnerId);
    if (byDriverPhone) return byDriverPhone;

    return this.repo.findByUserPhone(phone, scope.fleetOwnerId);
  }
}
