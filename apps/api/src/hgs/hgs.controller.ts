import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseUUIDPipe,
  Query,
  ParseArrayPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { HgsService } from './hgs.service';
import { SyncHgsDto } from './dto/sync-hgs.dto';
import { HgsListQueryDto } from './dto/hgs-list-query.dto';
import { SyncResultDto } from './dto/sync-result.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@hanbey-fleet/shared';

@ApiTags('HGS')
@ApiBearerAuth('access-token')
@Controller('hgs')
export class HgsController {
  constructor(private service: HgsService) {}

  @Get()
  @ApiOperation({ summary: 'List HGS transits with filtering, pagination and sorting' })
  findAll(@Query() query: HgsListQueryDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get HGS transit by ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Post('sync')
  @Roles(Role.OWNER, Role.ADMIN)
  @ApiOperation({
    summary: 'Synchronize HGS transits (simulated bank integration)',
    description:
      'Accepts an array of HGS transit records from a provider. Read-only aggregate — no manual CRUD.',
  })
  @ApiBody({ type: [SyncHgsDto] })
  sync(
    @Body(new ParseArrayPipe({ items: SyncHgsDto }))
    records: SyncHgsDto[],
  ): Promise<SyncResultDto> {
    return this.service.sync(records);
  }
}
