import { Module } from '@nestjs/common';
import { DriversService } from './drivers.service';
import { DriversController } from './drivers.controller';
import { DriversRepository } from './drivers.repository';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  providers: [DriversService, DriversRepository],
  controllers: [DriversController],
  exports: [DriversService, DriversRepository],
})
export class DriversModule {}
