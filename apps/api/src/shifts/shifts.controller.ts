import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ShiftsService } from './shifts.service';
import { StartShiftDto } from './dto/start-shift.dto';
import { EndShiftDto } from './dto/end-shift.dto';
import { CancelShiftDto } from './dto/cancel-shift.dto';
import { ShiftCurrentQueryDto } from './dto/shift-current-query.dto';
import { ShiftHistoryQueryDto } from './dto/shift-history-query.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role, JwtPayload } from '@hanbey-fleet/shared';

@ApiTags('Shifts')
@ApiBearerAuth('access-token')
@Roles(Role.OWNER, Role.MANAGER)
@Controller('shifts')
export class ShiftsController {
  constructor(private service: ShiftsService) {}

  @Post('start')
  @ApiOperation({ summary: 'Start a new shift' })
  start(@CurrentUser() user: JwtPayload, @Body() dto: StartShiftDto) {
    return this.service.startShift(user, dto);
  }

  @Get('current')
  @ApiOperation({ summary: 'Get current active shifts' })
  getCurrent(@CurrentUser() user: JwtPayload, @Query() query: ShiftCurrentQueryDto) {
    return this.service.getCurrent(user, query);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get shift history with filtering and pagination' })
  getHistory(@CurrentUser() user: JwtPayload, @Query() query: ShiftHistoryQueryDto) {
    return this.service.getHistory(user, query);
  }

  @Post(':id/end')
  @ApiOperation({ summary: 'End an active shift' })
  end(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: EndShiftDto,
  ) {
    return this.service.endShift(user, id, dto);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel an active shift' })
  cancel(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CancelShiftDto,
  ) {
    return this.service.cancelShift(user, id, dto);
  }
}
