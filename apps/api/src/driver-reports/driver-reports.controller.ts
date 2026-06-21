import { Controller, Get, Post, Body, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DriverReportsService } from './driver-reports.service';
import { CreateDriverReportDto } from './dto/create-driver-report.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role, JwtPayload } from '@hanbey-fleet/shared';

@ApiTags('Driver Reports')
@ApiBearerAuth('access-token')
@Roles(Role.OWNER, Role.MANAGER)
@Controller('driver-reports')
export class DriverReportsController {
  constructor(private service: DriverReportsService) {}

  @Post()
  @ApiOperation({ summary: 'Submit a driver declaration for a completed shift' })
  submit(@CurrentUser() user: JwtPayload, @Body() dto: CreateDriverReportDto) {
    return this.service.submit(user, dto);
  }

  @Get('shift/:shiftId')
  @ApiOperation({ summary: 'Get driver report by shift ID' })
  findByShift(@CurrentUser() user: JwtPayload, @Param('shiftId', ParseUUIDPipe) shiftId: string) {
    return this.service.findByShiftId(user, shiftId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get driver report by ID' })
  findOne(@CurrentUser() user: JwtPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(user, id);
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Approve a driver declaration' })
  approve(@CurrentUser() user: JwtPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.approve(user, id);
  }
}
