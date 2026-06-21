import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class OcrImportDto {
  @ApiProperty({
    description: 'Simulated OCR extracted text',
    example: 'Gelir: 2.500,00 TL\nHGS: 120,00\nShift: 550e8400-e29b-41d4-a716-446655440000',
  })
  @IsString()
  @MinLength(1)
  text: string;
}

export class WhatsAppImportDto {
  @ApiProperty({
    description: 'Simulated WhatsApp message body',
    example: 'Gelir 2500 HGS 214.5 Vardiya:550e8400-e29b-41d4-a716-446655440000',
  })
  @IsString()
  @MinLength(1)
  message: string;

  @ApiPropertyOptional({ example: '+905551234567' })
  @IsOptional()
  @IsString()
  sender?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  receivedAt?: string;
}
