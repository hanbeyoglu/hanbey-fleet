import { Controller, Get, Post, Body, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DriverReportsService } from './driver-reports.service';
import { CreateDriverReportDto } from './dto/create-driver-report.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role, JwtPayload } from '@hanbey-fleet/shared';

@ApiTags('Driver Reports')
@ApiBearerAuth('access-token')
@Controller('driver-reports')
export class DriverReportsController {
  constructor(private service: DriverReportsService) {}

  @Post()
  @Roles(Role.OWNER, Role.ADMIN, Role.DRIVER)
  @ApiOperation({ summary: 'Submit a driver declaration for a completed shift' })
  submit(@Body() dto: CreateDriverReportDto) {
    return this.service.submit(dto);
  }

  @Get('shift/:shiftId')
  @Roles(Role.OWNER, Role.ADMIN, Role.DRIVER)
  @ApiOperation({ summary: 'Get driver report by shift ID' })
  findByShift(@Param('shiftId', ParseUUIDPipe) shiftId: string) {
    return this.service.findByShiftId(shiftId);
  }

  @Get(':id')
  @Roles(Role.OWNER, Role.ADMIN, Role.DRIVER)
  @ApiOperation({ summary: 'Get driver report by ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Post(':id/approve')
  @Roles(Role.OWNER, Role.ADMIN)
  @ApiOperation({ summary: 'Approve a driver declaration' })
  approve(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: JwtPayload) {
    return this.service.approve(id, user.sub);
  }
}
