import { Module } from '@nestjs/common';
import { TimelineService } from './timeline.service';
import { TimelineController } from './timeline.controller';
import { TimelineRepository } from './timeline.repository';

@Module({
  providers: [TimelineService, TimelineRepository],
  controllers: [TimelineController],
  exports: [TimelineService],
})
export class TimelineModule {}
