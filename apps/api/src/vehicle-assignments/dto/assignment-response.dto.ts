import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AssignmentStatus } from '@hanbey-fleet/shared';

export class AssignmentVehicleSummaryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  plate: string;

  @ApiProperty()
  brand: string;

  @ApiProperty()
  model: string;
}

export class AssignmentDriverSummaryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  username: string;
}

export class AssignmentUserSummaryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  username: string;
}

export class VehicleAssignmentResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  vehicleId: string;

  @ApiProperty()
  driverId: string;

  @ApiProperty()
  assignedById: string;

  @ApiProperty()
  assignedAt: Date;

  @ApiPropertyOptional()
  releasedAt: Date | null;

  @ApiPropertyOptional()
  releaseReason: string | null;

  @ApiPropertyOptional()
  notes: string | null;

  @ApiProperty({ enum: AssignmentStatus, description: 'Computed: ACTIVE if releasedAt is null' })
  status: AssignmentStatus;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional({ type: AssignmentVehicleSummaryDto })
  vehicle?: AssignmentVehicleSummaryDto;

  @ApiPropertyOptional({ type: AssignmentDriverSummaryDto })
  driver?: AssignmentDriverSummaryDto;

  @ApiPropertyOptional({ type: AssignmentUserSummaryDto })
  assignedBy?: AssignmentUserSummaryDto;
}
