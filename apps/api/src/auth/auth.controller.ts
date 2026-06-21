import { Controller, Post, Get, Body, UseGuards, SetMetadata } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { SelectFleetDto } from './dto/select-fleet.dto';
import { JwtAuthGuard, IS_PUBLIC_KEY } from '../common/guards/jwt-auth.guard';
import { SkipFleetContext } from '../common/decorators/skip-fleet-context.decorator';
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
  @ApiOperation({ summary: 'Login — returns JWT tokens and fleet memberships (BR-156)' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Public()
  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token' })
  refresh(@Body('refreshToken') refreshToken: string) {
    return this.authService.refreshTokens(refreshToken);
  }

  @SkipFleetContext()
  @Get('me')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get current authenticated user' })
  getMe(@CurrentUser() user: JwtPayload) {
    return this.authService.getMe(user.sub, user.fleetOwnerId);
  }

  // BR-156 / BR-158: Driver selects fleet after login; SUPER_ADMIN can switch fleets
  @SkipFleetContext()
  @Post('clear-fleet')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Clear fleet scope for SUPER_ADMIN global mode (BR-165)' })
  clearFleet(@CurrentUser() user: JwtPayload) {
    return this.authService.clearFleetContext(user.sub);
  }

  @SkipFleetContext()
  @Post('select-fleet')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Select a fleet to scope the session (BR-156, BR-158)' })
  selectFleet(@CurrentUser() user: JwtPayload, @Body() dto: SelectFleetDto) {
    return this.authService.selectFleet(user.sub, dto);
  }
}
