import { DocumentStatus, DOCUMENT_EXPIRING_THRESHOLD_DAYS } from '@hanbey-fleet/shared';

export function computeDocumentStatus(
  expiryDate: Date | null | undefined,
  referenceDate: Date = new Date(),
): DocumentStatus {
  if (!expiryDate) {
    return DocumentStatus.VALID;
  }

  const threshold = new Date(referenceDate);
  threshold.setDate(threshold.getDate() + DOCUMENT_EXPIRING_THRESHOLD_DAYS);

  if (expiryDate < referenceDate) {
    return DocumentStatus.EXPIRED;
  }

  if (expiryDate <= threshold) {
    return DocumentStatus.EXPIRING;
  }

  return DocumentStatus.VALID;
}

export function buildStatusDateFilter(
  status: DocumentStatus,
  referenceDate: Date = new Date(),
): { expiryDate?: { lt?: Date; gte?: Date; lte?: Date; gt?: Date } } | { OR: Array<{ expiryDate?: { lt?: Date; gt?: Date } | null }> } {
  const threshold = new Date(referenceDate);
  threshold.setDate(threshold.getDate() + DOCUMENT_EXPIRING_THRESHOLD_DAYS);

  switch (status) {
    case DocumentStatus.EXPIRED:
      return { expiryDate: { lt: referenceDate } };
    case DocumentStatus.EXPIRING:
      return { expiryDate: { gte: referenceDate, lte: threshold } };
    case DocumentStatus.VALID:
      return {
        OR: [{ expiryDate: { gt: threshold } }, { expiryDate: null }],
      };
    default:
      return {};
  }
}
