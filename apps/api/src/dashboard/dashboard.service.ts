import { Injectable } from '@nestjs/common';
import { SettlementStatus } from '@hanbey-fleet/shared';
import { DashboardRepository, DateRange } from './dashboard.repository';
import { TimelineService } from '../timeline/timeline.service';
import { DocumentsService } from '../documents/documents.service';
import { DashboardOverviewDto } from './dto/dashboard-overview.dto';
import { DashboardChartDto, DashboardChartPointDto } from './dto/dashboard-chart.dto';
import { DashboardMapper } from './mappers/dashboard.mapper';

const CHART_DAYS = 30;
const TIMELINE_LIMIT = 20;

@Injectable()
export class DashboardService {
  constructor(
    private repo: DashboardRepository,
    private timeline: TimelineService,
    private documents: DocumentsService,
  ) {}

  async getOverview(): Promise<DashboardOverviewDto> {
    const todayRange = this.getTodayRange();
    const dateKey = DashboardMapper.formatDateKey(todayRange.start);

    const [
      revenueResult,
      expensesResult,
      hgsResult,
      activeVehicles,
      activeDrivers,
      completedShifts,
      maintenanceCount,
      settlementGroups,
      timelineEvents,
      complianceCounts,
      expiredDocuments,
    ] = await Promise.all([
      this.repo.sumSettlementNetRevenue(todayRange),
      this.repo.sumExpenses(todayRange),
      this.repo.sumHgs(todayRange),
      this.repo.countActiveVehicles(),
      this.repo.countActiveDrivers(),
      this.repo.countCompletedShifts(todayRange),
      this.repo.countMaintenance(todayRange),
      this.repo.settlementCountsByStatus(),
      this.timeline.findRecent(TIMELINE_LIMIT),
      this.documents.getComplianceCounts(),
      this.documents.getExpiredForDashboard(10),
    ]);

    const revenue = DashboardMapper.toNumber(revenueResult._sum.netRevenue);
    const expenses = DashboardMapper.toNumber(expensesResult._sum.amount);
    const hgs = DashboardMapper.toNumber(hgsResult._sum.amount);

    return DashboardMapper.toOverview({
      date: dateKey,
      today: {
        revenue,
        expenses,
        hgs,
        netRevenue: this.roundCurrency(revenue - expenses - hgs),
        completedShifts,
        maintenanceCount,
      },
      settlements: this.buildSettlementSummary(settlementGroups),
      fleet: { activeVehicles, activeDrivers },
      timelineEvents,
      compliance: {
        expiredCount: complianceCounts.expired,
        expiringCount: complianceCounts.expiring,
        expiredDocuments,
      },
    });
  }

  async getCharts(): Promise<DashboardChartDto> {
    const range = this.getChartRange();

    const [revenueRows, expenseRows, hgsRows] = await Promise.all([
      this.repo.revenueByDay(range),
      this.repo.expensesByDay(range),
      this.repo.hgsByDay(range),
    ]);

    const dayKeys = this.buildDayKeys(range.start, CHART_DAYS);

    return DashboardMapper.toCharts({
      revenue: this.fillChartSeries(dayKeys, DashboardMapper.chartPointsFromRows(revenueRows)),
      expenses: this.fillChartSeries(dayKeys, DashboardMapper.chartPointsFromRows(expenseRows)),
      hgs: this.fillChartSeries(dayKeys, DashboardMapper.chartPointsFromRows(hgsRows)),
    });
  }

  private buildSettlementSummary(
    groups: Array<{ status: string; _count: number }>,
  ): DashboardOverviewDto['financialSummary']['settlements'] {
    const counts = {
      matched: 0,
      mismatch: 0,
      approved: 0,
    };

    for (const group of groups) {
      if (group.status === SettlementStatus.MATCHED) counts.matched = group._count;
      if (group.status === SettlementStatus.MISMATCH) counts.mismatch = group._count;
      if (group.status === SettlementStatus.APPROVED) counts.approved = group._count;
    }

    return counts;
  }

  private fillChartSeries(
    dayKeys: string[],
    points: DashboardChartPointDto[],
  ): DashboardChartPointDto[] {
    const valueByDate = new Map(points.map((point) => [point.date, point.value]));

    return dayKeys.map((date) => ({
      date,
      value: valueByDate.get(date) ?? 0,
    }));
  }

  private buildDayKeys(start: Date, days: number): string[] {
    const keys: string[] = [];
    const cursor = new Date(start);

    for (let i = 0; i < days; i++) {
      keys.push(DashboardMapper.formatDateKey(cursor));
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }

    return keys;
  }

  private getTodayRange(): DateRange {
    const now = new Date();
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 1);
    return { start, end };
  }

  private getChartRange(): DateRange {
    const end = new Date();
    end.setUTCHours(23, 59, 59, 999);
    const start = new Date(end);
    start.setUTCDate(start.getUTCDate() - (CHART_DAYS - 1));
    start.setUTCHours(0, 0, 0, 0);
    const rangeEnd = new Date(start);
    rangeEnd.setUTCDate(rangeEnd.getUTCDate() + CHART_DAYS);
    return { start, end: rangeEnd };
  }

  private roundCurrency(value: number): number {
    return Math.round(value * 100) / 100;
  }
}
