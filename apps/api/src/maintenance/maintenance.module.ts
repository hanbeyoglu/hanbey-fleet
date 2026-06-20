import { Module } from '@nestjs/common';
import { MaintenanceService } from './maintenance.service';
import { MaintenanceController } from './maintenance.controller';
import { MaintenanceRepository } from './maintenance.repository';
import { TimelineModule } from '../timeline/timeline.module';

@Module({
  imports: [TimelineModule],
  providers: [MaintenanceService, MaintenanceRepository],
  controllers: [MaintenanceController],
  exports: [MaintenanceService, MaintenanceRepository],
})
export class MaintenanceModule {}
