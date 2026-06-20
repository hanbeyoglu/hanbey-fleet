import { IsEmail, IsString, IsEnum, IsOptional, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '@hanbey-fleet/shared';

export class CreateUserDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty({ minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({ enum: Role, default: Role.DRIVER })
  @IsEnum(Role)
  @IsOptional()
  role?: Role;
}
