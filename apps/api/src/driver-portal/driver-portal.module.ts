import { Module } from '@nestjs/common';
import { DriverPortalService } from './driver-portal.service';
import { DriverPortalController } from './driver-portal.controller';
import { DriversModule } from '../drivers/drivers.module';
import { VehicleAssignmentsModule } from '../vehicle-assignments/vehicle-assignments.module';
import { ShiftsModule } from '../shifts/shifts.module';
import { VehiclesModule } from '../vehicles/vehicles.module';
import { DriverReportsModule } from '../driver-reports/driver-reports.module';
import { TimelineModule } from '../timeline/timeline.module';
import { UsersModule } from '../users/users.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { DocumentsModule } from '../documents/documents.module';

@Module({
  imports: [
    DriversModule,
    VehicleAssignmentsModule,
    ShiftsModule,
    VehiclesModule,
    DriverReportsModule,
    TimelineModule,
    UsersModule,
    NotificationsModule,
    DocumentsModule,
  ],
  providers: [DriverPortalService],
  controllers: [DriverPortalController],
})
export class DriverPortalModule {}
