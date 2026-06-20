import { Module } from '@nestjs/common';
import { DriverReportsService } from './driver-reports.service';
import { DriverReportsController } from './driver-reports.controller';
import { DriverReportsRepository } from './driver-reports.repository';
import { ShiftsModule } from '../shifts/shifts.module';
import { TimelineModule } from '../timeline/timeline.module';

@Module({
  imports: [ShiftsModule, TimelineModule],
  providers: [DriverReportsService, DriverReportsRepository],
  controllers: [DriverReportsController],
  exports: [DriverReportsService, DriverReportsRepository],
})
export class DriverReportsModule {}
