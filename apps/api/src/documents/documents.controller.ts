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
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role, JwtPayload, PaginatedResponse } from '@hanbey-fleet/shared';

@ApiTags('Documents')
@ApiBearerAuth('access-token')
@Controller('documents')
@Roles(Role.OWNER, Role.MANAGER)
export class DocumentsController {
  constructor(private service: DocumentsService) {}

  @Get()
  @ApiOperation({ summary: 'List documents with filters' })
  findAll(
    @CurrentUser() user: JwtPayload,
    @Query() query: DocumentListQueryDto,
  ): Promise<PaginatedResponse<DocumentResponseDto>> {
    return this.service.findAll(user, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get document detail with revision history' })
  findOne(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<DocumentResponseDto> {
    return this.service.findOne(user, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create document with initial file metadata' })
  create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateDocumentDto,
  ): Promise<DocumentResponseDto> {
    return this.service.create(user, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update document metadata' })
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDocumentDto,
  ): Promise<DocumentResponseDto> {
    return this.service.update(user, id, dto);
  }

  @Post(':id/new-version')
  @ApiOperation({ summary: 'Upload a new document revision (metadata only)' })
  createNewVersion(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateDocumentRevisionDto,
  ): Promise<DocumentResponseDto> {
    return this.service.createNewVersion(user, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete document' })
  remove(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<DocumentResponseDto> {
    return this.service.softDelete(user, id);
  }
}
