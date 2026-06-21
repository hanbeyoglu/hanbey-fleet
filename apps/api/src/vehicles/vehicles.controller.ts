import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { VehiclesService } from './vehicles.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { VehicleListQueryDto } from './dto/vehicle-list-query.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role, JwtPayload } from '@hanbey-fleet/shared';

@ApiTags('Vehicles')
@ApiBearerAuth('access-token')
@Roles(Role.SUPER_ADMIN, Role.OWNER, Role.MANAGER)
@Controller('vehicles')
export class VehiclesController {
  constructor(private service: VehiclesService) {}

  @Get()
  @ApiOperation({ summary: 'List vehicles with filtering, pagination and sorting' })
  findAll(@CurrentUser() user: JwtPayload, @Query() query: VehicleListQueryDto) {
    return this.service.findAll(user, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get vehicle by ID with active shift and timeline' })
  findOne(@CurrentUser() user: JwtPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(user, id);
  }

  @Post()
  @ApiOperation({ summary: 'Register a new vehicle' })
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateVehicleDto) {
    return this.service.create(user, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update vehicle details' })
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateVehicleDto,
  ) {
    return this.service.update(user, id, dto);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN, Role.OWNER)
  @ApiOperation({ summary: 'Soft delete vehicle' })
  remove(@CurrentUser() user: JwtPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(user, id);
  }
}
