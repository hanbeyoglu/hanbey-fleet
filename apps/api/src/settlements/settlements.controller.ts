import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SettlementsService } from './settlements.service';
import { CreateSettlementDto } from './dto/create-settlement.dto';
import { ApproveSettlementDto } from './dto/approve-settlement.dto';
import { SettlementListQueryDto } from './dto/settlement-list-query.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role, JwtPayload } from '@hanbey-fleet/shared';

@ApiTags('Settlements')
@ApiBearerAuth('access-token')
@Controller('settlements')
export class SettlementsController {
  constructor(private service: SettlementsService) {}

  @Get()
  @ApiOperation({ summary: 'List settlements with filtering, pagination and sorting' })
  findAll(@Query() query: SettlementListQueryDto) {
    return this.service.findAll(query);
  }

  @Post('create')
  @Roles(Role.OWNER, Role.ADMIN)
  @ApiOperation({ summary: 'Create settlement from an approved driver report' })
  create(@Body() dto: CreateSettlementDto) {
    return this.service.create(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get settlement by ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Post(':id/approve')
  @Roles(Role.OWNER, Role.ADMIN)
  @ApiOperation({ summary: 'Approve a settlement' })
  approve(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() _dto: ApproveSettlementDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.approve(id, user.sub);
  }
}
