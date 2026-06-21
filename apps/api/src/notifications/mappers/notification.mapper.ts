import { Notification } from '@prisma/client';
import { NotificationResponseDto } from '../dto/notification-response.dto';
import { NotificationType, PaginatedResponse, PaginationMeta } from '@hanbey-fleet/shared';

export class NotificationMapper {
  static toResponse(notification: Notification): NotificationResponseDto {
    return {
      id: notification.id,
      userId: notification.userId,
      title: notification.title,
      message: notification.message,
      type: notification.type as NotificationType,
      isRead: notification.isRead,
      readAt: notification.readAt,
      metadata: notification.metadata as Record<string, unknown> | null,
      createdAt: notification.createdAt,
      updatedAt: notification.updatedAt,
    };
  }

  static toPaginatedResponse(
    notifications: Notification[],
    meta: PaginationMeta,
  ): PaginatedResponse<NotificationResponseDto> {
    return {
      data: notifications.map(NotificationMapper.toResponse),
      meta,
    };
  }
}
