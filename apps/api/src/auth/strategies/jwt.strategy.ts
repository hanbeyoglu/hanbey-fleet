import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from '@hanbey-fleet/shared';
import { UsersRepository } from '../../users/users.repository';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private usersRepository: UsersRepository,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<JwtPayload> {
    const user = await this.usersRepository.findActiveById(payload.sub);

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    return { sub: payload.sub, email: payload.email, role: payload.role };
  }
}
