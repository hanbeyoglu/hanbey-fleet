import { TimelineEvent, Vehicle } from '@prisma/client';
import {
  DashboardOverviewDto,
  FinancialSummaryDto,
  FleetStatusDto,
  AssignmentSummaryDto,
  TimelineEventSummaryDto,
  TimelineSummaryDto,
  TodayStatisticsDto,
  ComplianceSummaryDto,
  ExpiredDocumentSummaryDto,
} from '../dto/dashboard-overview.dto';
import { DashboardChartDto, DashboardChartPointDto } from '../dto/dashboard-chart.dto';

type TimelineWithVehicle = TimelineEvent & {
  vehicle?: Pick<Vehicle, 'id' | 'plate'> | null;
};

type DailyAggregateRow = { date: Date; value: unknown };

export class DashboardMapper {
  static toOverview(params: {
    date: string;
    today: TodayStatisticsDto;
    settlements: FinancialSummaryDto['settlements'];
    fleet: FleetStatusDto;
    assignments: AssignmentSummaryDto;
    timelineEvents: TimelineWithVehicle[];
    compliance: ComplianceSummaryDto;
  }): DashboardOverviewDto {
    return {
      date: params.date,
      financialSummary: {
        today: params.today,
        settlements: params.settlements,
      },
      fleet: params.fleet,
      assignments: params.assignments,
      timeline: DashboardMapper.toTimelineSummary(params.timelineEvents),
      compliance: params.compliance,
    };
  }

  static toCharts(params: {
    revenue: DashboardChartPointDto[];
    expenses: DashboardChartPointDto[];
    hgs: DashboardChartPointDto[];
  }): DashboardChartDto {
    return params;
  }

  static toTimelineSummary(events: TimelineWithVehicle[]): TimelineSummaryDto {
    return {
      events: events.map(DashboardMapper.toTimelineEvent),
    };
  }

  static toTimelineEvent(event: TimelineWithVehicle): TimelineEventSummaryDto {
    return {
      id: event.id,
      eventType: event.eventType,
      description: event.description,
      eventTime: event.eventTime,
      vehicleId: event.vehicleId,
      vehiclePlate: event.vehicle?.plate ?? null,
    };
  }

  static toNumber(value: unknown): number {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'number') return value;
    if (typeof value === 'object' && value !== null && 'toNumber' in value) {
      return (value as { toNumber(): number }).toNumber();
    }
    return Number(value) || 0;
  }

  static chartPointsFromRows(rows: DailyAggregateRow[]): DashboardChartPointDto[] {
    return rows.map((row) => ({
      date: DashboardMapper.formatDateKey(row.date),
      value: DashboardMapper.toNumber(row.value),
    }));
  }

  static formatDateKey(date: Date): string {
    return date.toISOString().slice(0, 10);
  }
}
