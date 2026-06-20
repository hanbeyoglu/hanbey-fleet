import { Module } from '@nestjs/common';
import { HgsService } from './hgs.service';
import { HgsController } from './hgs.controller';
import { HgsRepository } from './hgs.repository';

@Module({
  providers: [HgsService, HgsRepository],
  controllers: [HgsController],
  exports: [HgsService, HgsRepository],
})
export class HgsModule {}
