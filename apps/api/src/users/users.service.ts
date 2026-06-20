import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { UsersRepository } from './users.repository';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

const BCRYPT_ROUNDS = 12;

@Injectable()
export class UsersService {
  constructor(private repo: UsersRepository) {}

  findAll() {
    return this.repo.findAll();
  }

  async findOne(id: string) {
    const user = await this.repo.findById(id);
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return user;
  }

  async create(dto: CreateUserDto) {
    const existing = await this.repo.findByEmail(dto.email);
    if (existing) throw new ConflictException('Email already registered');

    const hashedPassword = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    return this.repo.create({ ...dto, password: hashedPassword });
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.findOne(id);
    return this.repo.update(id, dto);
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.repo.softDelete(id);
  }
}
