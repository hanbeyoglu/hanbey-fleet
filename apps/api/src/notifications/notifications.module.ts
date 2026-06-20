import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsRepository } from './notifications.repository';

@Module({
  providers: [NotificationsService, NotificationsRepository],
  controllers: [NotificationsController],
  exports: [NotificationsService],
})
export class NotificationsModule {}
