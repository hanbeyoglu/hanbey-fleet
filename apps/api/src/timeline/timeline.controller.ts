import { Controller, Get, Query, Param, ParseUUIDPipe, ParseIntPipe, Optional } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { TimelineService } from './timeline.service';

@ApiTags('Timeline')
@ApiBearerAuth('access-token')
@Controller('timeline')
export class TimelineController {
  constructor(private service: TimelineService) {}

  @Get()
  @ApiOperation({ summary: 'Get all timeline events' })
  findAll() {
    return this.service.findAll();
  }

  @Get('vehicle/:vehicleId')
  @ApiOperation({ summary: 'Get timeline events for a vehicle' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findByVehicle(
    @Param('vehicleId', ParseUUIDPipe) vehicleId: string,
    @Query('limit') limit?: number,
  ) {
    return this.service.findByVehicle(vehicleId, limit ? Number(limit) : undefined);
  }
}
