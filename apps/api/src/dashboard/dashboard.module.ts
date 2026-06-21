import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { DashboardRepository } from './dashboard.repository';
import { TimelineModule } from '../timeline/timeline.module';
import { DocumentsModule } from '../documents/documents.module';

@Module({
  imports: [TimelineModule, DocumentsModule],
  providers: [DashboardService, DashboardRepository],
  controllers: [DashboardController],
  exports: [DashboardService],
})
export class DashboardModule {}
