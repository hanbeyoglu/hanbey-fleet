import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { SchedulerService } from './scheduler.service';
import { SchedulerController } from './scheduler.controller';
import { NotificationsModule } from '../notifications/notifications.module';
import { HgsModule } from '../hgs/hgs.module';
import { ImportsModule } from '../imports/imports.module';
import { DocumentsModule } from '../documents/documents.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    NotificationsModule,
    HgsModule,
    ImportsModule,
    DocumentsModule,
  ],
  providers: [SchedulerService],
  controllers: [SchedulerController],
  exports: [SchedulerService],
})
export class SchedulerModule {}
