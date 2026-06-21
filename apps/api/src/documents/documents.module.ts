import { Module } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { DocumentsController } from './documents.controller';
import { DocumentsRepository } from './documents.repository';
import { VehiclesModule } from '../vehicles/vehicles.module';
import { DriversModule } from '../drivers/drivers.module';
import { TimelineModule } from '../timeline/timeline.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [VehiclesModule, DriversModule, TimelineModule, NotificationsModule],
  providers: [DocumentsService, DocumentsRepository],
  controllers: [DocumentsController],
  exports: [DocumentsService, DocumentsRepository],
})
export class DocumentsModule {}
