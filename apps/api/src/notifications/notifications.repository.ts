import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationListQueryDto } from './dto/notification-list-query.dto';

export interface CreateNotificationData {
  userId: string;
  title: string;
  message: string;
  type: string;
  metadata?: Prisma.InputJsonValue;
}

@Injectable()
export class NotificationsRepository {
  constructor(private prisma: PrismaService) {}

  findMany(userId: string, query: NotificationListQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.NotificationWhereInput = {
      userId,
      deletedAt: null,
      ...(query.isRead !== undefined && { isRead: query.isRead }),
      ...(query.type && { type: query.type }),
    };

    return Promise.all([
      this.prisma.notification.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ isRead: 'asc' }, { createdAt: 'desc' }],
      }),
      this.prisma.notification.count({ where }),
    ]).then(([data, total]) => ({ data, total, page, limit }));
  }

  findUnreadCount(userId: string) {
    return this.prisma.notification.count({
      where: { userId, isRead: false, deletedAt: null },
    });
  }

  findByIdForUser(id: string, userId: string) {
    return this.prisma.notification.findFirst({
      where: { id, userId, deletedAt: null },
    });
  }

  findActiveByReference(userId: string, type: string, referenceId: string) {
    return this.prisma.notification.findFirst({
      where: {
        userId,
        type,
        deletedAt: null,
        metadata: { path: ['referenceId'], equals: referenceId },
      },
    });
  }

  create(data: CreateNotificationData) {
    return this.prisma.notification.create({ data });
  }

  markAsRead(id: string) {
    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true, readAt: new Date() },
    });
  }

  markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false, deletedAt: null },
      data: { isRead: true, readAt: new Date() },
    });
  }

  softDelete(id: string) {
    return this.prisma.notification.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
