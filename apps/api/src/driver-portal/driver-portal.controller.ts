import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DriverPortalService } from './driver-portal.service';
import { StartDriverShiftDto } from './dto/start-driver-shift.dto';
import { EndOfDayDto } from './dto/end-of-day.dto';
import {
  DriverPortalOverviewDto,
  DriverPortalProfileDto,
  DriverPortalAssignmentDto,
  EndOfDayResultDto,
} from './dto/driver-portal-response.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { SkipFleetContext } from '../common/decorators/skip-fleet-context.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role, JwtPayload, PaginatedResponse } from '@hanbey-fleet/shared';
import { ShiftResponseDto } from '../shifts/dto/shift-response.dto';
import { NotificationListQueryDto } from '../notifications/dto/notification-list-query.dto';
import { DocumentListQueryDto } from '../documents/dto/document-list-query.dto';
import { NotificationResponseDto } from '../notifications/dto/notification-response.dto';
import { DocumentResponseDto } from '../documents/dto/document-response.dto';

@ApiTags('Driver Portal')
@ApiBearerAuth('access-token')
@Roles(Role.DRIVER)
@Controller('driver-portal')
export class DriverPortalController {
  constructor(private service: DriverPortalService) {}

  @SkipFleetContext()
  @Get('me')
  @ApiOperation({ summary: 'Get current driver profile' })
  getMe(@CurrentUser() user: JwtPayload): Promise<DriverPortalProfileDto> {
    return this.service.getMe(user);
  }

  @Get('overview')
  @ApiOperation({ summary: 'Driver dashboard overview' })
  getOverview(@CurrentUser() user: JwtPayload): Promise<DriverPortalOverviewDto> {
    return this.service.getOverview(user);
  }

  @Get('assignment/current')
  @ApiOperation({ summary: 'Get current active vehicle assignment' })
  getCurrentAssignment(
    @CurrentUser() user: JwtPayload,
  ): Promise<DriverPortalAssignmentDto | null> {
    return this.service.getCurrentAssignment(user);
  }

  @Get('shift/current')
  @ApiOperation({ summary: 'Get current active shift' })
  getCurrentShift(@CurrentUser() user: JwtPayload): Promise<ShiftResponseDto | null> {
    return this.service.getCurrentShift(user);
  }

  @Post('shift/start')
  @ApiOperation({ summary: 'Start shift for assigned vehicle' })
  startShift(
    @CurrentUser() user: JwtPayload,
    @Body() dto: StartDriverShiftDto,
  ): Promise<ShiftResponseDto> {
    return this.service.startShift(user, dto);
  }

  @Post('shift/:id/end-of-day')
  @ApiOperation({ summary: 'Submit end-of-day report and complete shift' })
  submitEndOfDay(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: EndOfDayDto,
  ): Promise<EndOfDayResultDto> {
    return this.service.submitEndOfDay(user, id, dto);
  }

  @Get('shift/history')
  @ApiOperation({ summary: 'Get own shift history' })
  getShiftHistory(
    @CurrentUser() user: JwtPayload,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ): Promise<PaginatedResponse<ShiftResponseDto>> {
    return this.service.getShiftHistory(user, page, limit);
  }

  @Get('documents')
  @ApiOperation({ summary: 'List own driver documents' })
  getDocuments(
    @CurrentUser() user: JwtPayload,
    @Query() query: DocumentListQueryDto,
  ): Promise<PaginatedResponse<DocumentResponseDto>> {
    return this.service.getDocuments(user, query);
  }

  @Get('notifications')
  @ApiOperation({ summary: 'List own notifications' })
  getNotifications(
    @CurrentUser() user: JwtPayload,
    @Query() query: NotificationListQueryDto,
  ): Promise<PaginatedResponse<NotificationResponseDto>> {
    return this.service.getNotifications(user, query);
  }

  @Post('notifications/read-all')
  @ApiOperation({ summary: 'Mark all own notifications as read' })
  markAllNotificationsRead(@CurrentUser() user: JwtPayload) {
    return this.service.markAllNotificationsRead(user);
  }

  @Post('notifications/:id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  markNotificationRead(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<NotificationResponseDto> {
    return this.service.markNotificationRead(user, id);
  }
}
