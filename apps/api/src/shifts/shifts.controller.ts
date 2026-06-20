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
import { Role } from '@hanbey-fleet/shared';

@ApiTags('Shifts')
@ApiBearerAuth('access-token')
@Controller('shifts')
export class ShiftsController {
  constructor(private service: ShiftsService) {}

  @Post('start')
  @Roles(Role.OWNER, Role.ADMIN)
  @ApiOperation({ summary: 'Start a new shift' })
  start(@Body() dto: StartShiftDto) {
    return this.service.startShift(dto);
  }

  @Get('current')
  @Roles(Role.OWNER, Role.ADMIN, Role.DRIVER)
  @ApiOperation({ summary: 'Get current active shifts' })
  getCurrent(@Query() query: ShiftCurrentQueryDto) {
    return this.service.getCurrent(query);
  }

  @Get('history')
  @Roles(Role.OWNER, Role.ADMIN)
  @ApiOperation({ summary: 'Get shift history with filtering and pagination' })
  getHistory(@Query() query: ShiftHistoryQueryDto) {
    return this.service.getHistory(query);
  }

  @Post(':id/end')
  @Roles(Role.OWNER, Role.ADMIN)
  @ApiOperation({ summary: 'End an active shift' })
  end(@Param('id', ParseUUIDPipe) id: string, @Body() dto: EndShiftDto) {
    return this.service.endShift(id, dto);
  }

  @Post(':id/cancel')
  @Roles(Role.OWNER, Role.ADMIN)
  @ApiOperation({ summary: 'Cancel an active shift' })
  cancel(@Param('id', ParseUUIDPipe) id: string, @Body() dto: CancelShiftDto) {
    return this.service.cancelShift(id, dto);
  }
}
