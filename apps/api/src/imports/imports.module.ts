import { Module } from '@nestjs/common';
import { ImportService } from './import.service';
import { ImportController } from './import.controller';
import { ImportRepository } from './import.repository';
import { ParserService } from './parser.service';
import { ShiftsModule } from '../shifts/shifts.module';
import { DriverReportsModule } from '../driver-reports/driver-reports.module';
import { TimelineModule } from '../timeline/timeline.module';

@Module({
  imports: [ShiftsModule, DriverReportsModule, TimelineModule],
  providers: [ImportService, ImportRepository, ParserService],
  controllers: [ImportController],
  exports: [ImportService],
})
export class ImportsModule {}
