import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { VehicleAssignmentsService } from './vehicle-assignments.service';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { ReleaseAssignmentDto } from './dto/release-assignment.dto';
import { AssignmentListQueryDto } from './dto/assignment-list-query.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtPayload, Role } from '@hanbey-fleet/shared';

@ApiTags('Vehicle Assignments')
@ApiBearerAuth('access-token')
@Roles(Role.OWNER, Role.MANAGER)
@Controller('vehicle-assignments')
export class VehicleAssignmentsController {
  constructor(private service: VehicleAssignmentsService) {}

  @Post()
  @ApiOperation({ summary: 'Assign a vehicle to a driver (BR-120, BR-121, BR-122)' })
  assign(@CurrentUser() user: JwtPayload, @Body() dto: CreateAssignmentDto) {
    return this.service.assign(user, dto);
  }

  // history must appear before /:id to avoid route conflicts
  @Get('history')
  @ApiOperation({ summary: 'Full assignment history (all assignments, paginated)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getHistory(
    @CurrentUser() user: JwtPayload,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.service.getHistory(user, page, limit);
  }

  @Get()
  @ApiOperation({ summary: 'List assignments with filters (vehicleId, driverId, status, page, limit)' })
  findAll(@CurrentUser() user: JwtPayload, @Query() query: AssignmentListQueryDto) {
    return this.service.findAll(user, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get assignment by id' })
  findById(@CurrentUser() user: JwtPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.findById(user, id);
  }

  @Post(':id/release')
  @ApiOperation({ summary: 'Release an active assignment (BR-123, BR-127)' })
  release(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReleaseAssignmentDto,
  ) {
    return this.service.release(user, id, dto);
  }
}
