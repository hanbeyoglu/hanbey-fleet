import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtPayload, Role } from '@hanbey-fleet/shared';
import { IS_PUBLIC_KEY } from '../guards/jwt-auth.guard';
import { SKIP_FLEET_CONTEXT_KEY } from '../decorators/skip-fleet-context.decorator';

@Injectable()
export class FleetScopeGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const skipFleetContext = this.reflector.getAllAndOverride<boolean>(SKIP_FLEET_CONTEXT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (skipFleetContext) return true;

    const request = context.switchToHttp().getRequest();
    const user: JwtPayload | undefined = request.user;
    if (!user) return true;

    // BR-165: SUPER_ADMIN may operate without fleetOwnerId
    if (user.role === Role.SUPER_ADMIN) return true;

    // BR-166: Non-SUPER_ADMIN must have fleetOwnerId in JWT
    if (!user.fleetOwnerId) {
      throw new ForbiddenException('Fleet context required. Please select a fleet.');
    }

    return true;
  }
}
