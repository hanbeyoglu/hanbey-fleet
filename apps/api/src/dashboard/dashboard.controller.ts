import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { DashboardOverviewDto } from './dto/dashboard-overview.dto';
import { DashboardChartDto } from './dto/dashboard-chart.dto';

@ApiTags('Dashboard')
@ApiBearerAuth('access-token')
@Controller('dashboard')
export class DashboardController {
  constructor(private service: DashboardService) {}

  @Get()
  @ApiOperation({ summary: 'Get dashboard overview with today statistics and recent timeline' })
  getOverview(): Promise<DashboardOverviewDto> {
    return this.service.getOverview();
  }

  @Get('charts')
  @ApiOperation({ summary: 'Get revenue, expense and HGS chart data for the last 30 days' })
  getCharts(): Promise<DashboardChartDto> {
    return this.service.getCharts();
  }
}
