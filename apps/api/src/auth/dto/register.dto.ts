import { IsEmail, IsString, IsEnum, IsOptional, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '@hanbey-fleet/shared';

export class RegisterDto {
  @ApiProperty({ example: 'Ali Yılmaz' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'ali' })
  @IsString()
  username: string;

  @ApiPropertyOptional({ example: 'ali@hanbeyfleet.com' })
  @IsEmail()
  @IsOptional()
  email?: string;

  // BR-153: Phone is globally unique — identity of a person
  @ApiPropertyOptional({ example: '+90 555 123 4567', description: 'Globally unique phone number (BR-153)' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ example: 'password123', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({ enum: Role, default: Role.DRIVER })
  @IsEnum(Role)
  role?: Role = Role.DRIVER;
}
