import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TodayStatisticsDto {
  @ApiProperty({ description: 'SUM(Settlement.netRevenue) today (BR-061)' })
  revenue: number;

  @ApiProperty({ description: 'SUM(Expense.amount) today (BR-062)' })
  expenses: number;

  @ApiProperty({ description: 'SUM(HgsTransit.amount) today (BR-063)' })
  hgs: number;

  @ApiProperty({ description: 'Daily net: revenue minus expenses minus HGS' })
  netRevenue: number;

  @ApiProperty({ description: 'Completed shifts today (BR-066)' })
  completedShifts: number;

  @ApiProperty({ description: 'Maintenance records dated today (BR-067)' })
  maintenanceCount: number;
}

export class FinancialSummaryDto {
  @ApiProperty({ type: TodayStatisticsDto })
  today: TodayStatisticsDto;

  @ApiProperty({ description: 'Settlement counts by status (BR-068)' })
  settlements: {
    matched: number;
    mismatch: number;
    approved: number;
  };
}

export class FleetStatusDto {
  @ApiProperty({ description: 'Vehicles with ACTIVE_SHIFT status (BR-064)' })
  activeVehicles: number;

  @ApiProperty({ description: 'Drivers with ACTIVE shift (BR-065)' })
  activeDrivers: number;
}

export class TimelineEventSummaryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  eventType: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  eventTime: Date;

  @ApiPropertyOptional()
  vehicleId?: string;

  @ApiPropertyOptional()
  vehiclePlate?: string | null;
}

export class TimelineSummaryDto {
  @ApiProperty({ type: [TimelineEventSummaryDto] })
  events: TimelineEventSummaryDto[];
}

export class ExpiredDocumentSummaryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  type: string;

  @ApiProperty()
  ownerType: string;

  @ApiProperty()
  ownerId: string;

  @ApiPropertyOptional()
  ownerLabel?: string | null;

  @ApiProperty()
  expiryDate: Date;

  @ApiProperty()
  status: string;
}

export class ComplianceSummaryDto {
  @ApiProperty()
  expiredCount: number;

  @ApiProperty()
  expiringCount: number;

  @ApiProperty({ type: [ExpiredDocumentSummaryDto] })
  expiredDocuments: ExpiredDocumentSummaryDto[];
}

export class AssignmentSummaryDto {
  @ApiProperty({ description: 'Vehicles with an active assignment (BR-128)' })
  assignedVehicles: number;

  @ApiProperty({ description: 'Vehicles without an active assignment (BR-128)' })
  unassignedVehicles: number;

  @ApiProperty({ description: 'Drivers with an active assignment (BR-128)' })
  assignedDrivers: number;

  @ApiProperty({ description: 'Drivers without an active assignment (BR-128)' })
  availableDrivers: number;
}

export class DashboardOverviewDto {
  @ApiProperty({ example: '2026-06-20' })
  date: string;

  @ApiProperty({ type: FinancialSummaryDto })
  financialSummary: FinancialSummaryDto;

  @ApiProperty({ type: FleetStatusDto })
  fleet: FleetStatusDto;

  @ApiProperty({ type: AssignmentSummaryDto })
  assignments: AssignmentSummaryDto;

  @ApiProperty({ type: TimelineSummaryDto })
  timeline: TimelineSummaryDto;

  @ApiProperty({ type: ComplianceSummaryDto })
  compliance: ComplianceSummaryDto;
}
