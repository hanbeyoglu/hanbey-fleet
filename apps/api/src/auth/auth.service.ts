import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { UsersRepository } from '../users/users.repository';
import { FleetOwnersRepository } from '../fleet-owners/fleet-owners.repository';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { SelectFleetDto } from './dto/select-fleet.dto';
import { JwtPayload, Role } from '@hanbey-fleet/shared';

const BCRYPT_ROUNDS = 12;

@Injectable()
export class AuthService {
  constructor(
    private usersRepository: UsersRepository,
    private fleetOwnersRepository: FleetOwnersRepository,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.usersRepository.findByUsername(dto.username);
    if (existing) throw new ConflictException('Username already registered');

    const hashedPassword = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    const user = await this.usersRepository.create({
      name: dto.name,
      username: dto.username,
      email: dto.email,
      phone: dto.phone,
      password: hashedPassword,
      role: (dto.role as Role) ?? Role.DRIVER,
    });

    const tokens = await this.generateTokens(user.id, user.username, user.role as Role);
    return { user, ...tokens };
  }

  async login(dto: LoginDto) {
    const user = await this.usersRepository.findByUsernameWithPassword(dto.username);

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    // BR-156: Return fleet memberships so client can select fleet
    const memberships = await this.fleetOwnersRepository.findMembershipsByUser(user.id);

    const tokens = await this.generateTokens(user.id, user.username, user.role as Role);
    const { password: _, ...safeUser } = user;

    return {
      user: safeUser,
      ...tokens,
      fleetMemberships: memberships.map((m) => ({
        membershipId: m.id,
        fleetOwnerId: m.fleetOwner.id,
        fleetOwnerName: m.fleetOwner.name,
        role: m.role,
        status: m.status,
      })),
    };
  }

  async getMe(userId: string, fleetOwnerId?: string) {
    const user = await this.usersRepository.findById(userId);
    if (!user) throw new UnauthorizedException('User not found');

    const memberships = await this.fleetOwnersRepository.findMembershipsByUser(userId);
    let fleetOwnerName: string | undefined;

    if (fleetOwnerId) {
      const fleetOwner = await this.fleetOwnersRepository.findById(fleetOwnerId);
      fleetOwnerName = fleetOwner?.name;
    }

    return {
      ...user,
      fleetOwnerId,
      fleetOwnerName,
      fleetMemberships: memberships.map((m) => ({
        membershipId: m.id,
        fleetOwnerId: m.fleetOwner.id,
        fleetOwnerName: m.fleetOwner.name,
        role: m.role,
        status: m.status,
      })),
    };
  }

  async selectFleet(userId: string, dto: SelectFleetDto) {
    const user = await this.usersRepository.findById(userId);
    if (!user) throw new UnauthorizedException('User not found');

    const fleetOwner = await this.fleetOwnersRepository.findById(dto.fleetOwnerId);
    if (!fleetOwner) throw new BadRequestException('Fleet owner not found');

    // SUPER_ADMIN can access any fleet; others must have an active membership
    if (user.role !== Role.SUPER_ADMIN) {
      const membership = await this.fleetOwnersRepository.findMembership(
        dto.fleetOwnerId,
        userId,
      );
      if (!membership || membership.status !== 'ACTIVE') {
        throw new UnauthorizedException('You are not a member of this fleet');
      }
    }

    const tokens = await this.generateTokens(
      user.id,
      user.username,
      user.role as Role,
      dto.fleetOwnerId,
    );

    return {
      ...tokens,
      fleetOwnerId: dto.fleetOwnerId,
      fleetOwnerName: fleetOwner.name,
    };
  }

  // BR-165: SUPER_ADMIN may clear fleet scope to view all fleets globally
  async clearFleetContext(userId: string) {
    const user = await this.usersRepository.findById(userId);
    if (!user) throw new UnauthorizedException('User not found');
    if (user.role !== Role.SUPER_ADMIN) {
      throw new BadRequestException('Only SUPER_ADMIN can enter global fleet mode');
    }

    const tokens = await this.generateTokens(user.id, user.username, user.role as Role);
    return { ...tokens, fleetOwnerId: null, fleetOwnerName: null };
  }

  async refreshTokens(refreshToken: string) {
    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(refreshToken, {
        secret: this.configService.getOrThrow('JWT_REFRESH_SECRET'),
      });

      return this.generateTokens(
        payload.sub,
        payload.username,
        payload.role,
        payload.fleetOwnerId,
      );
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private async generateTokens(
    userId: string,
    username: string,
    role: Role,
    fleetOwnerId?: string,
  ) {
    const payload: JwtPayload = { sub: userId, username, role, fleetOwnerId };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.getOrThrow('JWT_SECRET'),
        expiresIn: this.configService.get('JWT_EXPIRES_IN', '7d'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.getOrThrow('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN', '30d'),
      }),
    ]);

    return { accessToken, refreshToken };
  }
}
