import { ApiProperty } from '@nestjs/swagger';

export class DashboardChartPointDto {
  @ApiProperty({ example: '2026-06-20' })
  date: string;

  @ApiProperty({ example: 1985.5 })
  value: number;
}

export class DashboardChartDto {
  @ApiProperty({ type: [DashboardChartPointDto] })
  revenue: DashboardChartPointDto[];

  @ApiProperty({ type: [DashboardChartPointDto] })
  expenses: DashboardChartPointDto[];

  @ApiProperty({ type: [DashboardChartPointDto] })
  hgs: DashboardChartPointDto[];
}
