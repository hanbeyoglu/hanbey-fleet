import { Module } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { VehiclesModule } from '../vehicles/vehicles.module';
import { ExpensesModule } from '../expenses/expenses.module';
import { HgsModule } from '../hgs/hgs.module';
import { MaintenanceModule } from '../maintenance/maintenance.module';

@Module({
  imports: [VehiclesModule, ExpensesModule, HgsModule, MaintenanceModule],
  providers: [ReportsService],
  controllers: [ReportsController],
})
export class ReportsModule {}
