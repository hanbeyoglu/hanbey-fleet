import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { DashboardOverviewDto } from './dto/dashboard-overview.dto';
import { DashboardChartDto } from './dto/dashboard-chart.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role, JwtPayload } from '@hanbey-fleet/shared';

@ApiTags('Dashboard')
@ApiBearerAuth('access-token')
@Roles(Role.OWNER, Role.MANAGER)
@Controller('dashboard')
export class DashboardController {
  constructor(private service: DashboardService) {}

  @Get()
  @ApiOperation({ summary: 'Get dashboard overview with today statistics and recent timeline' })
  getOverview(@CurrentUser() user: JwtPayload): Promise<DashboardOverviewDto> {
    return this.service.getOverview(user);
  }

  @Get('charts')
  @ApiOperation({ summary: 'Get revenue, expense and HGS chart data for the last 30 days' })
  getCharts(@CurrentUser() user: JwtPayload): Promise<DashboardChartDto> {
    return this.service.getCharts(user);
  }
}
