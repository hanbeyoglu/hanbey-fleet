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
@Roles(Role.OWNER, Role.MANAGER)
@Controller('settlements')
export class SettlementsController {
  constructor(private service: SettlementsService) {}

  @Get()
  @ApiOperation({ summary: 'List settlements with filtering, pagination and sorting' })
  findAll(@CurrentUser() user: JwtPayload, @Query() query: SettlementListQueryDto) {
    return this.service.findAll(user, query);
  }

  @Post('create')
  @ApiOperation({ summary: 'Create settlement from an approved driver report' })
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateSettlementDto) {
    return this.service.create(user, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get settlement by ID' })
  findOne(@CurrentUser() user: JwtPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(user, id);
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Approve a settlement' })
  approve(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() _dto: ApproveSettlementDto,
  ) {
    return this.service.approve(user, id);
  }
}
