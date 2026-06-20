import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNotificationDto } from './dto/create-notification.dto';

@Injectable()
export class NotificationsRepository {
  constructor(private prisma: PrismaService) {}

  findByUser(userId: string, unreadOnly = false) {
    return this.prisma.notification.findMany({
      where: { userId, ...(unreadOnly && { isRead: false }) },
      orderBy: { createdAt: 'desc' },
    });
  }

  countUnread(userId: string) {
    return this.prisma.notification.count({ where: { userId, isRead: false } });
  }

  create(dto: CreateNotificationDto) {
    return this.prisma.notification.create({ data: dto });
  }

  markRead(id: string) {
    return this.prisma.notification.update({ where: { id }, data: { isRead: true } });
  }

  markAllRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }
}
