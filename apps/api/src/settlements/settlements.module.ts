import { Module } from '@nestjs/common';
import { SettlementsService } from './settlements.service';
import { SettlementsController } from './settlements.controller';
import { SettlementsRepository } from './settlements.repository';
import { TimelineModule } from '../timeline/timeline.module';
import { DriverReportsModule } from '../driver-reports/driver-reports.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [TimelineModule, DriverReportsModule, NotificationsModule],
  providers: [SettlementsService, SettlementsRepository],
  controllers: [SettlementsController],
  exports: [SettlementsService, SettlementsRepository],
})
export class SettlementsModule {}
