import { Controller, Get, Post, Patch, Delete, Body, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DriversService } from './drivers.service';
import { CreateDriverDto } from './dto/create-driver.dto';
import { UpdateDriverDto } from './dto/update-driver.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@hanbey-fleet/shared';

@ApiTags('Drivers')
@ApiBearerAuth('access-token')
@Controller('drivers')
export class DriversController {
  constructor(private service: DriversService) {}

  @Get()
  @ApiOperation({ summary: 'List all drivers' })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get driver by ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @Roles(Role.OWNER, Role.ADMIN)
  @ApiOperation({ summary: 'Create driver profile' })
  create(@Body() dto: CreateDriverDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @Roles(Role.OWNER, Role.ADMIN)
  @ApiOperation({ summary: 'Update driver profile' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateDriverDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.OWNER)
  @ApiOperation({ summary: 'Soft delete driver' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
}
