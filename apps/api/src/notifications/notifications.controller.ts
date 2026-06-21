import { Controller, Get, Post, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { NotificationListQueryDto } from './dto/notification-list-query.dto';
import { NotificationResponseDto } from './dto/notification-response.dto';
import { UnreadCountDto } from './dto/unread-count.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtPayload, PaginatedResponse } from '@hanbey-fleet/shared';

@ApiTags('Notifications')
@ApiBearerAuth('access-token')
@Controller('notifications')
export class NotificationsController {
  constructor(private service: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'List my notifications with pagination and filters' })
  findMany(
    @CurrentUser() user: JwtPayload,
    @Query() query: NotificationListQueryDto,
  ): Promise<PaginatedResponse<NotificationResponseDto>> {
    return this.service.findMany(user.sub, query);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Count my unread notifications' })
  countUnread(@CurrentUser() user: JwtPayload): Promise<UnreadCountDto> {
    return this.service.countUnread(user.sub);
  }

  @Post('read-all')
  @ApiOperation({ summary: 'Mark all my notifications as read' })
  markAllAsRead(@CurrentUser() user: JwtPayload) {
    return this.service.markAllAsRead(user.sub);
  }

  @Post(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  markAsRead(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<NotificationResponseDto> {
    return this.service.markAsRead(user.sub, id);
  }
}
