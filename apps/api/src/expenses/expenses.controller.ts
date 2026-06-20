import { Controller, Get, Post, Patch, Delete, Body, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@hanbey-fleet/shared';

@ApiTags('Expenses')
@ApiBearerAuth('access-token')
@Controller('expenses')
export class ExpensesController {
  constructor(private service: ExpensesService) {}

  @Get()
  @ApiOperation({ summary: 'List expenses, optionally filter by vehicleId' })
  @ApiQuery({ name: 'vehicleId', required: false })
  findAll(@Query('vehicleId') vehicleId?: string) {
    return this.service.findAll(vehicleId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get expense by ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @Roles(Role.OWNER, Role.ADMIN)
  @ApiOperation({ summary: 'Record a vehicle expense' })
  create(@Body() dto: CreateExpenseDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @Roles(Role.OWNER, Role.ADMIN)
  @ApiOperation({ summary: 'Update expense' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateExpenseDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.OWNER)
  @ApiOperation({ summary: 'Soft delete expense' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
}
