import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SchedulerJobName, SchedulerJobStatus } from '@hanbey-fleet/shared';

export class SchedulerJobDto {
  @ApiProperty({ enum: SchedulerJobName })
  name: SchedulerJobName;

  @ApiProperty()
  label: string;

  @ApiProperty()
  schedule: string;

  @ApiProperty({ enum: SchedulerJobStatus })
  status: SchedulerJobStatus;

  @ApiPropertyOptional()
  lastRunAt?: Date | null;

  @ApiPropertyOptional()
  nextRunAt?: Date | null;

  @ApiPropertyOptional()
  lastDurationMs?: number | null;

  @ApiPropertyOptional()
  lastError?: string | null;
}

export class SchedulerStatusDto {
  @ApiProperty()
  enabled: boolean;

  @ApiProperty({ type: [SchedulerJobDto] })
  jobs: SchedulerJobDto[];
}

export class SchedulerRunResultDto {
  @ApiProperty({ enum: SchedulerJobName })
  job: SchedulerJobName;

  @ApiProperty({ enum: SchedulerJobStatus })
  status: SchedulerJobStatus;

  @ApiPropertyOptional()
  lastDurationMs?: number | null;

  @ApiPropertyOptional()
  lastError?: string | null;

  @ApiPropertyOptional()
  result?: Record<string, unknown> | null;
}
