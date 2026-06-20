import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { UsersRepository } from '../users/users.repository';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtPayload, Role } from '@hanbey-fleet/shared';

const BCRYPT_ROUNDS = 12;

@Injectable()
export class AuthService {
  constructor(
    private usersRepository: UsersRepository,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.usersRepository.findByEmail(dto.email);
    if (existing) throw new ConflictException('Email already registered');

    const hashedPassword = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    const user = await this.usersRepository.create({
      name: dto.name,
      email: dto.email,
      password: hashedPassword,
      role: (dto.role as Role) ?? Role.DRIVER,
    });

    const tokens = await this.generateTokens(user.id, user.email, user.role as Role);
    return { user, ...tokens };
  }

  async login(dto: LoginDto) {
    const user = await this.usersRepository.findByEmailWithPassword(dto.email);

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    const tokens = await this.generateTokens(user.id, user.email, user.role as Role);
    const { password: _, ...safeUser } = user;

    return { user: safeUser, ...tokens };
  }

  async getMe(userId: string) {
    const user = await this.usersRepository.findById(userId);
    if (!user) throw new UnauthorizedException('User not found');
    return user;
  }

  async refreshTokens(refreshToken: string) {
    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(refreshToken, {
        secret: this.configService.getOrThrow('JWT_REFRESH_SECRET'),
      });

      return this.generateTokens(payload.sub, payload.email, payload.role);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private async generateTokens(userId: string, email: string, role: Role) {
    const payload: JwtPayload = { sub: userId, email, role };

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
