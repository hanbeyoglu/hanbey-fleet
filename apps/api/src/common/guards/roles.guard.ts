import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role, JwtPayload } from '@hanbey-fleet/shared';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) return true;

    const request = context.switchToHttp().getRequest();
    const user: JwtPayload = request.user;

    if (!user) throw new ForbiddenException('Access denied');

    const hasRole = requiredRoles.some((role) => user.role === role);
    if (!hasRole) throw new ForbiddenException('Insufficient permissions');

    return true;
  }
}
