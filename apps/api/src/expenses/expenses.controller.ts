import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { ExpenseListQueryDto } from './dto/expense-list-query.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role, JwtPayload } from '@hanbey-fleet/shared';

@ApiTags('Expenses')
@ApiBearerAuth('access-token')
@Roles(Role.OWNER, Role.MANAGER)
@Controller('expenses')
export class ExpensesController {
  constructor(private service: ExpensesService) {}

  @Get()
  @ApiOperation({ summary: 'List expenses with filtering, pagination and sorting' })
  findAll(@CurrentUser() user: JwtPayload, @Query() query: ExpenseListQueryDto) {
    return this.service.findAll(user, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get expense by ID' })
  findOne(@CurrentUser() user: JwtPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(user, id);
  }

  @Post()
  @ApiOperation({ summary: 'Record a vehicle expense' })
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateExpenseDto) {
    return this.service.create(user, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update expense' })
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateExpenseDto,
  ) {
    return this.service.update(user, id, dto);
  }

  @Delete(':id')
  @Roles(Role.OWNER)
  @ApiOperation({ summary: 'Soft delete expense' })
  remove(@CurrentUser() user: JwtPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(user, id);
  }
}
