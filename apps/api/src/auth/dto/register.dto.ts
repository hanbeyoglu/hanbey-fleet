import { IsEmail, IsString, IsEnum, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '@hanbey-fleet/shared';

export class RegisterDto {
  @ApiProperty({ example: 'Ali Yılmaz' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'ali@hanbeyfleet.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({ enum: Role, default: Role.DRIVER })
  @IsEnum(Role)
  role?: Role = Role.DRIVER;
}
