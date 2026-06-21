import { IsString, IsOptional, IsEmail } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class FindOrCreateFleetOwnerDto {
  @ApiProperty({ description: 'Phone number to search for existing fleet owner (BR-152, BR-153)' })
  @IsString()
  phone: string;

  @ApiPropertyOptional({ description: 'Name — required only when creating a new fleet owner' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  taxNumber?: string;
}
