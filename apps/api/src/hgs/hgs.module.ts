import { Module } from '@nestjs/common';
import { HgsService } from './hgs.service';
import { HgsController } from './hgs.controller';
import { HgsRepository } from './hgs.repository';
import { TimelineModule } from '../timeline/timeline.module';
import { VehiclesModule } from '../vehicles/vehicles.module';
import { ShiftsModule } from '../shifts/shifts.module';

@Module({
  imports: [TimelineModule, VehiclesModule, ShiftsModule],
  providers: [HgsService, HgsRepository],
  controllers: [HgsController],
  exports: [HgsService, HgsRepository],
})
export class HgsModule {}
