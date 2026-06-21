import { Controller, Get, Post, Body, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ImportService } from './import.service';
import { CreateImportDto } from './dto/create-import.dto';
import { OcrImportDto, WhatsAppImportDto } from './dto/source-import.dto';
import { ImportListQueryDto } from './dto/import-list-query.dto';
import { ImportResponseDto } from './dto/import-response.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role, JwtPayload, PaginatedResponse } from '@hanbey-fleet/shared';

@ApiTags('Imports')
@ApiBearerAuth('access-token')
@Controller('imports')
@Roles(Role.OWNER, Role.MANAGER)
export class ImportController {
  constructor(private service: ImportService) {}

  @Post('manual')
  @ApiOperation({ summary: 'Import driver declaration from raw manual text' })
  importManual(@CurrentUser() user: JwtPayload, @Body() dto: CreateImportDto): Promise<ImportResponseDto> {
    return this.service.importManual(user, dto);
  }

  @Post('ocr')
  @ApiOperation({ summary: 'Import driver declaration from simulated OCR text' })
  importOcr(@CurrentUser() user: JwtPayload, @Body() dto: OcrImportDto): Promise<ImportResponseDto> {
    return this.service.importOcr(user, dto);
  }

  @Post('whatsapp')
  @ApiOperation({ summary: 'Import driver declaration from simulated WhatsApp payload' })
  importWhatsApp(@CurrentUser() user: JwtPayload, @Body() dto: WhatsAppImportDto): Promise<ImportResponseDto> {
    return this.service.importWhatsApp(user, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List import history' })
  findAll(
    @CurrentUser() user: JwtPayload,
    @Query() query: ImportListQueryDto,
  ): Promise<PaginatedResponse<ImportResponseDto>> {
    return this.service.findAll(user, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get import job detail' })
  findOne(@CurrentUser() user: JwtPayload, @Param('id', ParseUUIDPipe) id: string): Promise<ImportResponseDto> {
    return this.service.findOne(user, id);
  }
}
