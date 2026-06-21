import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsRepository } from './notifications.repository';
import { ReminderService } from './reminder.service';
import { ReminderRepository } from './reminder.repository';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  providers: [
    NotificationsService,
    NotificationsRepository,
    ReminderService,
    ReminderRepository,
  ],
  controllers: [NotificationsController],
  exports: [NotificationsService, ReminderService],
})
export class NotificationsModule {}
