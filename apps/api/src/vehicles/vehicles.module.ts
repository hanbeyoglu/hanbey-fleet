import { Module } from '@nestjs/common';
import { VehiclesService } from './vehicles.service';
import { VehiclesController } from './vehicles.controller';
import { VehiclesRepository } from './vehicles.repository';
import { TimelineModule } from '../timeline/timeline.module';

@Module({
  imports: [TimelineModule],
  providers: [VehiclesService, VehiclesRepository],
  controllers: [VehiclesController],
  exports: [VehiclesService, VehiclesRepository],
})
export class VehiclesModule {}
