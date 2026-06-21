import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FleetOwnersService } from './fleet-owners.service';
import { CreateFleetOwnerDto } from './dto/create-fleet-owner.dto';
import { UpdateFleetOwnerDto } from './dto/update-fleet-owner.dto';
import { FindOrCreateFleetOwnerDto } from './dto/find-or-create-fleet-owner.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { SkipFleetContext } from '../common/decorators/skip-fleet-context.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role, JwtPayload } from '@hanbey-fleet/shared';

@ApiTags('Fleet Owners')
@ApiBearerAuth('access-token')
@SkipFleetContext()
@Controller('fleet-owners')
export class FleetOwnersController {
  constructor(private service: FleetOwnersService) {}

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.OWNER, Role.MANAGER)
  @ApiOperation({ summary: 'List all fleet owners (SUPER_ADMIN) or own fleet' })
  findAll(@CurrentUser() user: JwtPayload) {
    return this.service.findAll(user);
  }

  @Get(':id')
  @Roles(Role.SUPER_ADMIN, Role.OWNER, Role.MANAGER)
  @ApiOperation({ summary: 'Get fleet owner by ID' })
  findOne(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.service.findOne(user, id);
  }

  @Post()
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new fleet owner (SUPER_ADMIN only)' })
  create(@Body() dto: CreateFleetOwnerDto) {
    return this.service.create(dto);
  }

  // BR-152: Find by phone or create — used during vehicle/driver creation
  @Post('find-or-create')
  @Roles(Role.SUPER_ADMIN, Role.OWNER, Role.MANAGER)
  @ApiOperation({ summary: 'Find fleet owner by phone or create new (BR-152)' })
  findOrCreate(@Body() dto: FindOrCreateFleetOwnerDto) {
    return this.service.findOrCreate(dto);
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update fleet owner (SUPER_ADMIN only)' })
  update(@Param('id') id: string, @Body() dto: UpdateFleetOwnerDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Soft delete fleet owner (SUPER_ADMIN only)' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Get(':id/members')
  @Roles(Role.SUPER_ADMIN, Role.OWNER, Role.MANAGER)
  @ApiOperation({ summary: 'List members of a fleet owner' })
  getMembers(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.service.getMemberships(user, id);
  }
}
