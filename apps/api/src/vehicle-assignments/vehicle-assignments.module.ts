import { Module } from '@nestjs/common';
import { VehicleAssignmentsService } from './vehicle-assignments.service';
import { VehicleAssignmentsController } from './vehicle-assignments.controller';
import { VehicleAssignmentsRepository } from './vehicle-assignments.repository';
import { VehiclesModule } from '../vehicles/vehicles.module';
import { DriversModule } from '../drivers/drivers.module';
import { TimelineModule } from '../timeline/timeline.module';

@Module({
  imports: [VehiclesModule, DriversModule, TimelineModule],
  providers: [VehicleAssignmentsService, VehicleAssignmentsRepository],
  controllers: [VehicleAssignmentsController],
  exports: [VehicleAssignmentsService, VehicleAssignmentsRepository],
})
export class VehicleAssignmentsModule {}
