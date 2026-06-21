import { Prisma, VehicleAssignment, Driver, User } from '@prisma/client';
import {
  DriverPortalProfileDto,
  DriverPortalAssignmentDto,
  DriverPortalVehicleDto,
} from '../dto/driver-portal-response.dto';
import { AssignmentStatus, Role } from '@hanbey-fleet/shared';

type AssignmentVehicle = {
  id: string;
  plate: string;
  brand: string;
  model: string;
  currentMileage: number;
  dailyFee: Prisma.Decimal;
};

type AssignmentWithVehicle = VehicleAssignment & {
  vehicle: AssignmentVehicle;
};

type DriverWithUser = Driver & {
  user: Pick<User, 'id' | 'username' | 'name' | 'email' | 'role'>;
};

export class DriverPortalMapper {
  static toProfile(driver: DriverWithUser): DriverPortalProfileDto {
    return {
      driverId: driver.id,
      licenseNo: driver.licenseNo,
      phone: driver.phone,
      address: driver.address,
      user: {
        id: driver.user.id,
        username: driver.user.username,
        name: driver.user.name,
        email: driver.user.email,
        role: driver.user.role as Role,
      },
    };
  }

  static toVehicle(vehicle: AssignmentVehicle): DriverPortalVehicleDto {
    return {
      id: vehicle.id,
      plate: vehicle.plate,
      brand: vehicle.brand,
      model: vehicle.model,
      currentMileage: vehicle.currentMileage,
      dailyFee: DriverPortalMapper.toNumber(vehicle.dailyFee),
    };
  }

  static toAssignment(assignment: AssignmentWithVehicle): DriverPortalAssignmentDto {
    return {
      id: assignment.id,
      assignedAt: assignment.assignedAt,
      status: assignment.releasedAt ? AssignmentStatus.RELEASED : AssignmentStatus.ACTIVE,
      vehicle: DriverPortalMapper.toVehicle(assignment.vehicle),
    };
  }

  static toNumber(value: Prisma.Decimal | number | null | undefined): number {
    if (value === null || value === undefined) return 0;
    return typeof value === 'number' ? value : value.toNumber();
  }
}
