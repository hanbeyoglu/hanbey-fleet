import { Document, DocumentRevision } from '@prisma/client';
import {
  DocumentResponseDto,
  DocumentRevisionResponseDto,
  ExpiredDocumentSummaryDto,
} from '../dto/document-response.dto';
import { computeDocumentStatus } from '../utils/document-status.util';
import {
  DocumentStatus,
  DocumentType,
  OwnerType,
  PaginatedResponse,
  PaginationMeta,
} from '@hanbey-fleet/shared';

type DocumentWithRevisions = Document & {
  revisions: DocumentRevision[];
  ownerLabel?: string | null;
};

export class DocumentMapper {
  static toResponse(document: DocumentWithRevisions): DocumentResponseDto {
    const sortedRevisions = [...document.revisions].sort((a, b) => b.version - a.version);
    const currentRevision = sortedRevisions[0];

    return {
      id: document.id,
      ownerType: document.ownerType as OwnerType,
      ownerId: document.ownerId,
      ownerLabel: document.ownerLabel ?? null,
      title: document.title,
      type: document.type as DocumentType,
      issueDate: document.issueDate,
      expiryDate: document.expiryDate,
      status: computeDocumentStatus(document.expiryDate),
      currentRevision: DocumentMapper.toRevision(currentRevision),
      revisions: sortedRevisions.map(DocumentMapper.toRevision),
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
    };
  }

  static toExpiredSummary(document: DocumentWithRevisions): ExpiredDocumentSummaryDto {
    return {
      id: document.id,
      title: document.title,
      type: document.type as DocumentType,
      ownerType: document.ownerType as OwnerType,
      ownerId: document.ownerId,
      ownerLabel: document.ownerLabel ?? null,
      expiryDate: document.expiryDate!,
      status: computeDocumentStatus(document.expiryDate),
    };
  }

  static toPaginatedResponse(
    documents: DocumentWithRevisions[],
    meta: PaginationMeta,
  ): PaginatedResponse<DocumentResponseDto> {
    return {
      data: documents.map(DocumentMapper.toResponse),
      meta,
    };
  }

  private static toRevision(revision: DocumentRevision): DocumentRevisionResponseDto {
    return {
      id: revision.id,
      version: revision.version,
      fileName: revision.fileName,
      fileUrl: revision.fileUrl,
      mimeType: revision.mimeType,
      size: revision.size,
      createdAt: revision.createdAt,
    };
  }
}
