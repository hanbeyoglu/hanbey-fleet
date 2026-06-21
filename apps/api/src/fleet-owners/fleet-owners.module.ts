import { Module } from '@nestjs/common';
import { FleetOwnersController } from './fleet-owners.controller';
import { FleetOwnersService } from './fleet-owners.service';
import { FleetOwnersRepository } from './fleet-owners.repository';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [FleetOwnersController],
  providers: [FleetOwnersService, FleetOwnersRepository],
  exports: [FleetOwnersService, FleetOwnersRepository],
})
export class FleetOwnersModule {}
