import { Controller, Get, Post, Body, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { HgsService } from './hgs.service';
import { SyncHgsDto } from './dto/sync-hgs.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@hanbey-fleet/shared';

@ApiTags('HGS')
@ApiBearerAuth('access-token')
@Controller('hgs')
export class HgsController {
  constructor(private service: HgsService) {}

  @Get()
  @ApiOperation({ summary: 'List HGS transits, optionally filter by vehicleId' })
  @ApiQuery({ name: 'vehicleId', required: false })
  findAll(@Query('vehicleId') vehicleId?: string) {
    return this.service.findAll(vehicleId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get HGS transit by ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Post('sync')
  @Roles(Role.OWNER, Role.ADMIN)
  @ApiOperation({
    summary: 'Sync HGS transits from İş Bankası API (not yet implemented)',
    description: 'Prepared for future İş Bankası API integration. Returns 501 until implemented.',
  })
  syncFromBank(@Body() dto: SyncHgsDto) {
    return this.service.syncFromBank(dto);
  }
}
