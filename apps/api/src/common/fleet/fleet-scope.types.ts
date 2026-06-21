import { Role } from '@hanbey-fleet/shared';

export interface FleetScope {
  fleetOwnerId: string | null;
  isGlobal: boolean;
  userId: string;
  role: Role;
}
