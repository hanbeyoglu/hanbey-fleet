import { IsString, IsUUID, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDriverDto {
  @ApiProperty({ description: 'User ID to link this driver profile to' })
  @IsUUID()
  userId: string;

  @ApiProperty({ example: 'B123456789' })
  @IsString()
  licenseNo: string;

  @ApiProperty({ example: '+90 555 123 4567' })
  @IsString()
  phone: string;

  @ApiPropertyOptional({ example: 'Istanbul, Turkey' })
  @IsString()
  @IsOptional()
  address?: string;
}
