import { Injectable } from '@nestjs/common';
import { NotificationsRepository } from './notifications.repository';
import { CreateNotificationDto } from './dto/create-notification.dto';

@Injectable()
export class NotificationsService {
  constructor(private repo: NotificationsRepository) {}

  findByUser(userId: string, unreadOnly?: boolean) {
    return this.repo.findByUser(userId, unreadOnly);
  }

  countUnread(userId: string) {
    return this.repo.countUnread(userId);
  }

  create(dto: CreateNotificationDto) {
    return this.repo.create(dto);
  }

  markRead(id: string) {
    return this.repo.markRead(id);
  }

  markAllRead(userId: string) {
    return this.repo.markAllRead(userId);
  }
}
