import { IsUUID, IsString, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NotificationType } from '@hanbey-fleet/shared';

export class CreateNotificationDto {
  @ApiProperty()
  @IsUUID()
  userId: string;

  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsString()
  message: string;

  @ApiProperty({ enum: NotificationType, default: NotificationType.INFO })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiPropertyOptional()
  @IsOptional()
  metadata?: Record<string, unknown>;
}
