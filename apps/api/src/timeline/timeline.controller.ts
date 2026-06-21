import { Controller, Get, Query, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { TimelineService } from './timeline.service';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role, JwtPayload } from '@hanbey-fleet/shared';

@ApiTags('Timeline')
@ApiBearerAuth('access-token')
@Roles(Role.OWNER, Role.MANAGER)
@Controller('timeline')
export class TimelineController {
  constructor(private service: TimelineService) {}

  @Get()
  @ApiOperation({ summary: 'Get all timeline events' })
  findAll(@CurrentUser() user: JwtPayload) {
    return this.service.findAll(user);
  }

  @Get('vehicle/:vehicleId')
  @ApiOperation({ summary: 'Get timeline events for a vehicle' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findByVehicle(
    @CurrentUser() user: JwtPayload,
    @Param('vehicleId', ParseUUIDPipe) vehicleId: string,
    @Query('limit') limit?: number,
  ) {
    return this.service.findByVehicle(user, vehicleId, limit ? Number(limit) : undefined);
  }
}
