import { Controller, Get, Post, Patch, Delete, Body, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { MaintenanceService } from './maintenance.service';
import { CreateMaintenanceDto } from './dto/create-maintenance.dto';
import { UpdateMaintenanceDto } from './dto/update-maintenance.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@hanbey-fleet/shared';

@ApiTags('Maintenance')
@ApiBearerAuth('access-token')
@Controller('maintenance')
export class MaintenanceController {
  constructor(private service: MaintenanceService) {}

  @Get()
  @ApiOperation({ summary: 'List maintenance records, optionally filter by vehicleId' })
  @ApiQuery({ name: 'vehicleId', required: false })
  findAll(@Query('vehicleId') vehicleId?: string) {
    return this.service.findAll(vehicleId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get maintenance record by ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @Roles(Role.OWNER, Role.ADMIN)
  @ApiOperation({ summary: 'Record vehicle maintenance' })
  create(@Body() dto: CreateMaintenanceDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @Roles(Role.OWNER, Role.ADMIN)
  @ApiOperation({ summary: 'Update maintenance record' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateMaintenanceDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.OWNER)
  @ApiOperation({ summary: 'Soft delete maintenance record' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
}
