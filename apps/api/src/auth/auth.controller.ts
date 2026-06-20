import { Controller, Post, Get, Body, UseGuards, SetMetadata } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard, IS_PUBLIC_KEY } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtPayload } from '@hanbey-fleet/shared';

const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

@ApiTags('Auth')
@UseGuards(JwtAuthGuard)
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Login and receive JWT tokens' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Public()
  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token' })
  refresh(@Body('refreshToken') refreshToken: string) {
    return this.authService.refreshTokens(refreshToken);
  }

  @Get('me')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get current authenticated user' })
  getMe(@CurrentUser() user: JwtPayload) {
    return this.authService.getMe(user.sub);
  }
}
