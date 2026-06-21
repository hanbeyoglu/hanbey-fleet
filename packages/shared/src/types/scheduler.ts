export enum SchedulerJobName {
  REMINDER_ALL_CHECKS = 'reminder-all-checks',
  MISSING_DRIVER_REPORTS = 'missing-driver-reports',
  SETTLEMENT_MISMATCH = 'settlement-mismatch',
  MAINTENANCE_REMINDER = 'maintenance-reminder',
  WARRANTY_REMINDER = 'warranty-reminder',
  DOCUMENT_EXPIRY = 'document-expiry',
  HGS_SYNC = 'hgs-sync',
  IMPORT_CLEANUP = 'import-cleanup',
}

export enum SchedulerJobStatus {
  NEVER_RUN = 'NEVER_RUN',
  RUNNING = 'RUNNING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
}
