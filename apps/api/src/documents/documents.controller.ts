import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DocumentsService } from './documents.service';
import {
  CreateDocumentDto,
  CreateDocumentRevisionDto,
  UpdateDocumentDto,
} from './dto/create-document.dto';
import { DocumentListQueryDto } from './dto/document-list-query.dto';
import { DocumentResponseDto } from './dto/document-response.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { Role, PaginatedResponse } from '@hanbey-fleet/shared';

@ApiTags('Documents')
@ApiBearerAuth('access-token')
@Controller('documents')
@Roles(Role.OWNER, Role.ADMIN)
export class DocumentsController {
  constructor(private service: DocumentsService) {}

  @Get()
  @ApiOperation({ summary: 'List documents with filters' })
  findAll(
    @Query() query: DocumentListQueryDto,
  ): Promise<PaginatedResponse<DocumentResponseDto>> {
    return this.service.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get document detail with revision history' })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<DocumentResponseDto> {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create document with initial file metadata' })
  create(@Body() dto: CreateDocumentDto): Promise<DocumentResponseDto> {
    return this.service.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update document metadata' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDocumentDto,
  ): Promise<DocumentResponseDto> {
    return this.service.update(id, dto);
  }

  @Post(':id/new-version')
  @ApiOperation({ summary: 'Upload a new document revision (metadata only)' })
  createNewVersion(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateDocumentRevisionDto,
  ): Promise<DocumentResponseDto> {
    return this.service.createNewVersion(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete document' })
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<DocumentResponseDto> {
    return this.service.softDelete(id);
  }
}
