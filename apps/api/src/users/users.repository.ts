import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@hanbey-fleet/shared';

const USER_SELECT = {
  id: true,
  username: true,
  name: true,
  email: true,
  role: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} as const;

interface CreateUserData {
  name: string;
  username: string;
  email?: string;
  password: string;
  role?: Role;
}

@Injectable()
export class UsersRepository {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.user.findMany({
      where: { deletedAt: null },
      select: USER_SELECT,
      orderBy: { createdAt: 'desc' },
    });
  }

  findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id, deletedAt: null },
      select: { ...USER_SELECT, driver: { select: { id: true, licenseNo: true, phone: true } } },
    });
  }

  findByUsername(username: string) {
    return this.prisma.user.findUnique({
      where: { username },
      select: USER_SELECT,
    });
  }

  findByUsernameWithPassword(username: string) {
    return this.prisma.user.findUnique({
      where: { username, deletedAt: null },
    });
  }

  findActiveById(id: string) {
    return this.prisma.user.findUnique({
      where: { id, deletedAt: null },
      select: USER_SELECT,
    });
  }

  create(data: CreateUserData) {
    return this.prisma.user.create({
      data,
      select: USER_SELECT,
    });
  }

  update(id: string, data: Partial<CreateUserData>) {
    return this.prisma.user.update({
      where: { id },
      data,
      select: USER_SELECT,
    });
  }

  softDelete(id: string) {
    return this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
      select: USER_SELECT,
    });
  }
}
