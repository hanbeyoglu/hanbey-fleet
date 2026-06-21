import { Module, forwardRef } from '@nestjs/common';
import { TimelineService } from './timeline.service';
import { TimelineController } from './timeline.controller';
import { TimelineRepository } from './timeline.repository';
import { VehiclesModule } from '../vehicles/vehicles.module';

@Module({
  imports: [forwardRef(() => VehiclesModule)],
  providers: [TimelineService, TimelineRepository],
  controllers: [TimelineController],
  exports: [TimelineService, TimelineRepository],
})
export class TimelineModule {}
