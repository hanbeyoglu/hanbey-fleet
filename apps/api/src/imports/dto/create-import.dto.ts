import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class CreateImportDto {
  @ApiProperty({
    description: 'Raw driver declaration text',
    example:
      'Vardiya: 550e8400-e29b-41d4-a716-446655440000\nGelir: 2500\nHGS: 214.50\nNot: Gün sonu raporu',
  })
  @IsString()
  @MinLength(1)
  rawContent: string;
}
