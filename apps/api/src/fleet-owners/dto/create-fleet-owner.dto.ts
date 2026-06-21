import { IsString, IsOptional, IsEmail } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateFleetOwnerDto {
  @ApiProperty({ example: 'Hanbey Filo A' })
  @IsString()
  name: string;

  @ApiProperty({ example: '+90 555 001 0001' })
  @IsString()
  phone: string;

  @ApiPropertyOptional({ example: 'owner@fleetA.com' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: 'Kadıköy, İstanbul' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ example: '1234567890' })
  @IsString()
  @IsOptional()
  taxNumber?: string;
}
