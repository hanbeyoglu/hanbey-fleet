import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { NotificationsRepository } from './notifications.repository';
import { UsersRepository } from '../users/users.repository';
import { NotificationListQueryDto } from './dto/notification-list-query.dto';
import { NotificationResponseDto } from './dto/notification-response.dto';
import { UnreadCountDto } from './dto/unread-count.dto';
import { NotificationMapper } from './mappers/notification.mapper';
import {
  NotificationType,
  PaginatedResponse,
} from '@hanbey-fleet/shared';

export interface FleetNotificationPayload {
  type: NotificationType;
  title: string;
  message: string;
  referenceId: string;
  referenceType: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class NotificationsService {
  constructor(
    private repo: NotificationsRepository,
    private usersRepo: UsersRepository,
  ) {}

  async findMany(
    userId: string,
    query: NotificationListQueryDto,
  ): Promise<PaginatedResponse<NotificationResponseDto>> {
    const { data, total, page, limit } = await this.repo.findMany(userId, query);

    return NotificationMapper.toPaginatedResponse(data, {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    });
  }

  async countUnread(userId: string): Promise<UnreadCountDto> {
    const count = await this.repo.findUnreadCount(userId);
    return { count };
  }

  async markAsRead(userId: string, id: string): Promise<NotificationResponseDto> {
    const notification = await this.repo.findByIdForUser(id, userId);
    if (!notification) {
      throw new NotFoundException(`Notification ${id} not found`);
    }
    if (notification.isRead) {
      return NotificationMapper.toResponse(notification);
    }

    const updated = await this.repo.markAsRead(id);
    return NotificationMapper.toResponse(updated);
  }

  async markAllAsRead(userId: string): Promise<{ updated: number }> {
    const result = await this.repo.markAllAsRead(userId);
    return { updated: result.count };
  }

  async notifyFleetManagers(payload: FleetNotificationPayload): Promise<void> {
    const managers = await this.usersRepo.findFleetManagers();

    await Promise.all(
      managers.map(async (manager) => {
        const exists = await this.repo.findActiveByReference(
          manager.id,
          payload.type,
          payload.referenceId,
        );
        if (exists) return;

        await this.repo.create({
          userId: manager.id,
          title: payload.title,
          message: payload.message,
          type: payload.type,
          metadata: {
            referenceId: payload.referenceId,
            referenceType: payload.referenceType,
            ...payload.metadata,
          },
        });
      }),
    );
  }

  async notifySettlementMismatch(settlement: {
    id: string;
    shiftId: string;
    difference: { toNumber(): number } | number;
    shift?: { vehicle?: { plate?: string } | null } | null;
  }): Promise<void> {
    const plate = settlement.shift?.vehicle?.plate ?? 'unknown';
    const difference =
      typeof settlement.difference === 'number'
        ? settlement.difference
        : settlement.difference.toNumber();

    await this.notifyFleetManagers({
      type: NotificationType.SETTLEMENT_MISMATCH,
      title: 'Settlement mismatch detected',
      message: `Settlement for vehicle ${plate} has a HGS difference of ${difference.toFixed(2)} TRY.`,
      referenceId: settlement.id,
      referenceType: 'settlement',
      metadata: {
        settlementId: settlement.id,
        shiftId: settlement.shiftId,
        difference,
        vehiclePlate: plate,
      },
    });
  }

  async softDelete(userId: string, id: string): Promise<void> {
    const notification = await this.repo.findByIdForUser(id, userId);
    if (!notification) {
      throw new NotFoundException(`Notification ${id} not found`);
    }
    await this.repo.softDelete(id);
  }
}
