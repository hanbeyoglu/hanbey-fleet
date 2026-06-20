import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { DriversRepository } from './drivers.repository';
import { CreateDriverDto } from './dto/create-driver.dto';
import { UpdateDriverDto } from './dto/update-driver.dto';

@Injectable()
export class DriversService {
  constructor(private repo: DriversRepository) {}

  findAll() {
    return this.repo.findAll();
  }

  async findOne(id: string) {
    const driver = await this.repo.findById(id);
    if (!driver) throw new NotFoundException(`Driver ${id} not found`);
    return driver;
  }

  async create(dto: CreateDriverDto) {
    const byUser = await this.repo.findByUserId(dto.userId);
    if (byUser) throw new ConflictException('User already has a driver profile');

    const byLicense = await this.repo.findByLicense(dto.licenseNo);
    if (byLicense) throw new ConflictException(`License number ${dto.licenseNo} already registered`);

    return this.repo.create(dto);
  }

  async update(id: string, dto: UpdateDriverDto) {
    await this.findOne(id);

    if (dto.licenseNo) {
      const existing = await this.repo.findByLicense(dto.licenseNo);
      if (existing && existing.id !== id) {
        throw new ConflictException(`License number ${dto.licenseNo} already in use`);
      }
    }

    return this.repo.update(id, dto);
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.repo.softDelete(id);
  }
}
