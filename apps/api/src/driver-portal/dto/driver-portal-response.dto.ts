import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role, ShiftStatus, AssignmentStatus } from '@hanbey-fleet/shared';
import { DriverReportResponseDto } from '../../driver-reports/dto/driver-report-response.dto';
import { ExpenseResponseDto } from '../../expenses/dto/expense-response.dto';
import { ShiftResponseDto } from '../../shifts/dto/shift-response.dto';

export class DriverPortalUserDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  username: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  email?: string | null;

  @ApiProperty({ enum: Role })
  role: Role;
}

export class DriverPortalProfileDto {
  @ApiProperty()
  driverId: string;

  @ApiProperty()
  licenseNo: string;

  @ApiProperty()
  phone: string;

  @ApiPropertyOptional()
  address?: string | null;

  @ApiProperty({ type: DriverPortalUserDto })
  user: DriverPortalUserDto;
}

export class DriverPortalVehicleDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  plate: string;

  @ApiProperty()
  brand: string;

  @ApiProperty()
  model: string;

  @ApiProperty()
  currentMileage: number;

  @ApiProperty({ example: 5000 })
  dailyFee: number;
}

export class DriverPortalAssignmentDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  assignedAt: Date;

  @ApiProperty({ enum: AssignmentStatus })
  status: AssignmentStatus;

  @ApiProperty({ type: DriverPortalVehicleDto })
  vehicle: DriverPortalVehicleDto;
}

export class DriverPortalOverviewDto {
  @ApiProperty({ type: DriverPortalProfileDto })
  profile: DriverPortalProfileDto;

  @ApiPropertyOptional({ type: DriverPortalAssignmentDto })
  currentAssignment?: DriverPortalAssignmentDto | null;

  @ApiPropertyOptional({ type: ShiftResponseDto })
  activeShift?: ShiftResponseDto | null;

  @ApiProperty({ description: 'Whether the driver can start a new shift' })
  canStartShift: boolean;

  @ApiProperty({ description: 'Whether the driver can submit end-of-day for active shift' })
  canSubmitEndOfDay: boolean;
}

export class EndOfDayResultDto {
  @ApiProperty()
  cashToDeliver: number;

  @ApiProperty()
  dailyFee: number;

  @ApiProperty()
  declaredHgs: number;

  @ApiProperty()
  posAmount: number;

  @ApiProperty()
  totalExpenses: number;

  @ApiProperty({ type: ShiftResponseDto })
  shift: ShiftResponseDto;

  @ApiProperty({ type: DriverReportResponseDto })
  driverReport: DriverReportResponseDto;

  @ApiProperty({ type: [ExpenseResponseDto] })
  expenses: ExpenseResponseDto[];
}

export class DriverPortalShiftHistoryQueryDto {
  @ApiPropertyOptional({ default: 1 })
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  limit?: number;
}
