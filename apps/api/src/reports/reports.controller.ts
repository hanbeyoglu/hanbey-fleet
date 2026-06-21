import { Controller, Get, Param, Query, ParseUUIDPipe, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role, JwtPayload } from '@hanbey-fleet/shared';

@ApiTags('Reports')
@ApiBearerAuth('access-token')
@Roles(Role.OWNER, Role.MANAGER)
@Controller('reports')
export class ReportsController {
  constructor(private service: ReportsService) {}

  @Get('monthly')
  @ApiOperation({ summary: 'Fleet-wide monthly financial summary' })
  @ApiQuery({ name: 'year', type: Number, example: 2024 })
  @ApiQuery({ name: 'month', type: Number, example: 6 })
  monthlySummary(
    @CurrentUser() user: JwtPayload,
    @Query('year', ParseIntPipe) year: number,
    @Query('month', ParseIntPipe) month: number,
  ) {
    return this.service.monthlySummary(user, year, month);
  }

  @Get('vehicle/:id')
  @ApiOperation({ summary: 'Monthly report for a specific vehicle' })
  @ApiQuery({ name: 'year', type: Number, example: 2024 })
  @ApiQuery({ name: 'month', type: Number, example: 6 })
  vehicleReport(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Query('year', ParseIntPipe) year: number,
    @Query('month', ParseIntPipe) month: number,
  ) {
    return this.service.vehicleReport(user, id, year, month);
  }
}
