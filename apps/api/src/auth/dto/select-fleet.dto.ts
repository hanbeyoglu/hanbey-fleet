import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SelectFleetDto {
  @ApiProperty({ description: 'Fleet owner ID to scope the session (BR-156, BR-158)' })
  @IsString()
  fleetOwnerId: string;
}
