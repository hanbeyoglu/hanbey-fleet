import { Controller, Get, Post, Patch, Body, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtPayload, Role } from '@hanbey-fleet/shared';

@ApiTags('Notifications')
@ApiBearerAuth('access-token')
@Controller('notifications')
export class NotificationsController {
  constructor(private service: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get my notifications' })
  @ApiQuery({ name: 'unreadOnly', required: false, type: Boolean })
  findMine(
    @CurrentUser() user: JwtPayload,
    @Query('unreadOnly') unreadOnly?: boolean,
  ) {
    return this.service.findByUser(user.sub, unreadOnly);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Count my unread notifications' })
  countUnread(@CurrentUser() user: JwtPayload) {
    return this.service.countUnread(user.sub);
  }

  @Post()
  @Roles(Role.OWNER, Role.ADMIN)
  @ApiOperation({ summary: 'Create a notification for a user' })
  create(@Body() dto: CreateNotificationDto) {
    return this.service.create(dto);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  markRead(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.markRead(id);
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all my notifications as read' })
  markAllRead(@CurrentUser() user: JwtPayload) {
    return this.service.markAllRead(user.sub);
  }
}
