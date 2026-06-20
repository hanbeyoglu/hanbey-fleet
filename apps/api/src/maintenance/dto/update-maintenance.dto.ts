import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateMaintenanceDto } from './create-maintenance.dto';

export class UpdateMaintenanceDto extends PartialType(
  OmitType(CreateMaintenanceDto, ['vehicleId'] as const),
) {}
