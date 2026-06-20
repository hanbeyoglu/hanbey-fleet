import { Module } from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { ExpensesController } from './expenses.controller';
import { ExpensesRepository } from './expenses.repository';
import { TimelineModule } from '../timeline/timeline.module';
import { VehiclesModule } from '../vehicles/vehicles.module';
import { ShiftsModule } from '../shifts/shifts.module';

@Module({
  imports: [TimelineModule, VehiclesModule, ShiftsModule],
  providers: [ExpensesService, ExpensesRepository],
  controllers: [ExpensesController],
  exports: [ExpensesService, ExpensesRepository],
})
export class ExpensesModule {}
