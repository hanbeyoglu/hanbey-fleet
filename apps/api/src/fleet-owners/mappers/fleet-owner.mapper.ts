import { FleetOwnerResponseDto, FleetOwnerSummaryDto } from '../dto/fleet-owner-response.dto';

type FleetOwnerWithCounts = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  address: string | null;
  taxNumber: string | null;
  createdAt: Date;
  updatedAt: Date;
  _count?: { vehicles: number; memberships: number };
};

type FleetOwnerRaw = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  address: string | null;
  taxNumber: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export class FleetOwnerMapper {
  static toResponse(owner: FleetOwnerWithCounts): FleetOwnerResponseDto {
    return {
      id: owner.id,
      name: owner.name,
      phone: owner.phone,
      email: owner.email,
      address: owner.address,
      taxNumber: owner.taxNumber,
      vehicleCount: owner._count?.vehicles ?? 0,
      memberCount: owner._count?.memberships ?? 0,
      createdAt: owner.createdAt,
      updatedAt: owner.updatedAt,
    };
  }

  static toSummary(owner: FleetOwnerRaw): FleetOwnerSummaryDto {
    return {
      id: owner.id,
      name: owner.name,
      phone: owner.phone,
      email: owner.email,
    };
  }
}
