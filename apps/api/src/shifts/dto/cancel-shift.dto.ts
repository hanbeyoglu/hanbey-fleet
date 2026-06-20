import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CancelShiftDto {
  @ApiProperty({ example: 'Vehicle breakdown' })
  @IsString()
  @MinLength(3)
  reason: string;
}
