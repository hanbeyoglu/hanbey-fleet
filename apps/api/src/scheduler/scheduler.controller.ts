import { Controller, Get, Post, Param, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { SchedulerService } from './scheduler.service';
import {
  SchedulerRunResultDto,
  SchedulerStatusDto,
} from './dto/scheduler.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { Role, SchedulerJobName } from '@hanbey-fleet/shared';

@ApiTags('Scheduler')
@ApiBearerAuth('access-token')
@Controller('scheduler')
@Roles(Role.OWNER, Role.ADMIN)
export class SchedulerController {
  constructor(private service: SchedulerService) {}

  @Get('jobs')
  @ApiOperation({ summary: 'Get scheduler job status' })
  getJobs(): SchedulerStatusDto {
    return this.service.getStatus();
  }

  @Post('run/:job')
  @ApiOperation({ summary: 'Manually execute a scheduler job' })
  @ApiParam({ name: 'job', enum: SchedulerJobName })
  runJob(@Param('job') job: string): Promise<SchedulerRunResultDto> {
    if (!Object.values(SchedulerJobName).includes(job as SchedulerJobName)) {
      throw new BadRequestException(`Unknown scheduler job: ${job}`);
    }
    return this.service.runJob(job as SchedulerJobName);
  }
}
