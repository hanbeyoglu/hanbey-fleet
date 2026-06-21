import { Controller, Get, Post, Patch, Delete, Body, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { DriversService } from './drivers.service';
import { CreateDriverDto } from './dto/create-driver.dto';
import { UpdateDriverDto } from './dto/update-driver.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role, JwtPayload } from '@hanbey-fleet/shared';

@ApiTags('Drivers')
@ApiBearerAuth('access-token')
@Roles(Role.OWNER, Role.MANAGER, Role.SUPER_ADMIN)
@Controller('drivers')
export class DriversController {
  constructor(private service: DriversService) {}

  @Get()
  @ApiOperation({ summary: 'List all drivers' })
  findAll(@CurrentUser() user: JwtPayload) {
    return this.service.findAll(user);
  }

  // BR-154: Search driver by phone before creating — prevents duplicate accounts
  @Get('find-by-phone')
  @ApiQuery({ name: 'phone', required: true, description: 'Phone number to search (BR-154)' })
  @ApiOperation({ summary: 'Find driver by phone number (BR-154)' })
  findByPhone(@CurrentUser() user: JwtPayload, @Query('phone') phone: string) {
    return this.service.findByPhone(user, phone);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get driver by ID' })
  findOne(@CurrentUser() user: JwtPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(user, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create driver profile (search by phone first — BR-154)' })
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateDriverDto) {
    return this.service.create(user, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update driver profile' })
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDriverDto,
  ) {
    return this.service.update(user, id, dto);
  }

  @Delete(':id')
  @Roles(Role.OWNER, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Soft delete driver' })
  remove(@CurrentUser() user: JwtPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(user, id);
  }
}
