import { Global, Module } from '@nestjs/common';
import { FleetScopeService } from './fleet-scope.service';

@Global()
@Module({
  providers: [FleetScopeService],
  exports: [FleetScopeService],
})
export class FleetModule {}
