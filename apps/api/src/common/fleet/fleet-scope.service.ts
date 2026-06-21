import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { JwtPayload, Role } from '@hanbey-fleet/shared';
import { FleetScope } from './fleet-scope.types';

@Injectable()
export class FleetScopeService {
  // BR-165 / BR-166: SUPER_ADMIN may operate globally; others require fleetOwnerId in JWT
  resolve(user: JwtPayload, queryFleetOwnerId?: string): FleetScope {
    if (user.role === Role.SUPER_ADMIN) {
      const fleetOwnerId = queryFleetOwnerId ?? user.fleetOwnerId ?? null;
      return {
        fleetOwnerId,
        isGlobal: !fleetOwnerId,
        userId: user.sub,
        role: user.role,
      };
    }

    if (!user.fleetOwnerId) {
      throw new ForbiddenException('Fleet context required. Please select a fleet.');
    }

    return {
      fleetOwnerId: user.fleetOwnerId,
      isGlobal: false,
      userId: user.sub,
      role: user.role,
    };
  }

  requireFleetOwnerId(scope: FleetScope): string {
    if (!scope.fleetOwnerId) {
      throw new ForbiddenException('Fleet context required for this operation');
    }
    return scope.fleetOwnerId;
  }

  // BR-168: Cross-fleet access returns 404 to avoid leaking data existence
  assertVehicleInScope(vehicle: { fleetOwnerId: string | null } | null | undefined, scope: FleetScope) {
    if (!vehicle || scope.isGlobal) return;
    if (vehicle.fleetOwnerId !== scope.fleetOwnerId) {
      throw new NotFoundException('Resource not found');
    }
  }

  assertEntityInScope(
    entityFleetOwnerId: string | null | undefined,
    scope: FleetScope,
    message = 'Resource not found',
  ) {
    if (scope.isGlobal) return;
    if (entityFleetOwnerId !== scope.fleetOwnerId) {
      throw new NotFoundException(message);
    }
  }
}
