import { Module } from '@nestjs/common';
import { ShiftsService } from './shifts.service';
import { ShiftsController } from './shifts.controller';
import { ShiftsRepository } from './shifts.repository';
import { VehiclesModule } from '../vehicles/vehicles.module';
import { DriversModule } from '../drivers/drivers.module';
import { TimelineModule } from '../timeline/timeline.module';

@Module({
  imports: [VehiclesModule, DriversModule, TimelineModule],
  providers: [ShiftsService, ShiftsRepository],
  controllers: [ShiftsController],
  exports: [ShiftsService, ShiftsRepository],
})
export class ShiftsModule {}
