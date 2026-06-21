import { Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression, SchedulerRegistry } from '@nestjs/schedule';
import { ReminderService } from '../notifications/reminder.service';
import { HgsService } from '../hgs/hgs.service';
import { ImportService } from '../imports/import.service';
import { DocumentsService } from '../documents/documents.service';
import {
  SchedulerJobDto,
  SchedulerRunResultDto,
  SchedulerStatusDto,
} from './dto/scheduler.dto';
import { SchedulerJobName, SchedulerJobStatus } from '@hanbey-fleet/shared';

interface JobRuntimeState {
  label: string;
  schedule: string;
  cronName: string;
  status: SchedulerJobStatus;
  lastRunAt?: Date;
  nextRunAt?: Date;
  lastDurationMs?: number;
  lastError?: string;
}

const JOB_DEFINITIONS: Array<{
  name: SchedulerJobName;
  label: string;
  schedule: string;
  cronName: string;
}> = [
  {
    name: SchedulerJobName.REMINDER_ALL_CHECKS,
    label: 'Reminder All Checks',
    schedule: 'Every hour',
    cronName: 'scheduler-reminder-all-checks',
  },
  {
    name: SchedulerJobName.MISSING_DRIVER_REPORTS,
    label: 'Missing Driver Reports',
    schedule: 'Every hour',
    cronName: 'scheduler-missing-driver-reports',
  },
  {
    name: SchedulerJobName.SETTLEMENT_MISMATCH,
    label: 'Settlement Mismatch',
    schedule: 'Every 30 minutes',
    cronName: 'scheduler-settlement-mismatch',
  },
  {
    name: SchedulerJobName.MAINTENANCE_REMINDER,
    label: 'Maintenance Reminders',
    schedule: 'Every day at 08:00',
    cronName: 'scheduler-maintenance-reminder',
  },
  {
    name: SchedulerJobName.WARRANTY_REMINDER,
    label: 'Warranty Reminders',
    schedule: 'Every day at 09:00',
    cronName: 'scheduler-warranty-reminder',
  },
  {
    name: SchedulerJobName.DOCUMENT_EXPIRY,
    label: 'Document Expiry Notifications',
    schedule: 'Every day at 10:00',
    cronName: 'scheduler-document-expiry',
  },
  {
    name: SchedulerJobName.HGS_SYNC,
    label: 'HGS Sync Stub',
    schedule: 'Every day at 02:00',
    cronName: 'scheduler-hgs-sync',
  },
  {
    name: SchedulerJobName.IMPORT_CLEANUP,
    label: 'Import Cleanup',
    schedule: 'Every day at 03:00',
    cronName: 'scheduler-import-cleanup',
  },
];

@Injectable()
export class SchedulerService implements OnModuleInit {
  private readonly logger = new Logger(SchedulerService.name);
  private readonly jobStates = new Map<SchedulerJobName, JobRuntimeState>();

  constructor(
    private schedulerRegistry: SchedulerRegistry,
    private reminderService: ReminderService,
    private hgsService: HgsService,
    private importService: ImportService,
    private documentsService: DocumentsService,
  ) {
    for (const definition of JOB_DEFINITIONS) {
      this.jobStates.set(definition.name, {
        label: definition.label,
        schedule: definition.schedule,
        cronName: definition.cronName,
        status: SchedulerJobStatus.NEVER_RUN,
      });
    }
  }

  onModuleInit() {
    for (const definition of JOB_DEFINITIONS) {
      this.refreshNextRun(definition.name);
    }
  }

  getStatus(): SchedulerStatusDto {
    for (const definition of JOB_DEFINITIONS) {
      this.refreshNextRun(definition.name);
    }

    return {
      enabled: true,
      jobs: JOB_DEFINITIONS.map((definition) => this.toJobDto(definition.name)),
    };
  }

  async runJob(jobName: SchedulerJobName): Promise<SchedulerRunResultDto> {
    if (!this.jobStates.has(jobName)) {
      throw new NotFoundException(`Scheduler job "${jobName}" not found`);
    }

    const result = await this.executeJob(jobName, true);
    const state = this.jobStates.get(jobName)!;

    return {
      job: jobName,
      status: state.status,
      lastDurationMs: state.lastDurationMs,
      lastError: state.lastError,
      result: result ?? null,
    };
  }

  @Cron(CronExpression.EVERY_HOUR, { name: 'scheduler-reminder-all-checks' })
  async handleReminderAllChecks() {
    await this.executeJob(SchedulerJobName.REMINDER_ALL_CHECKS);
  }

  @Cron(CronExpression.EVERY_HOUR, { name: 'scheduler-missing-driver-reports' })
  async handleMissingDriverReports() {
    await this.executeJob(SchedulerJobName.MISSING_DRIVER_REPORTS);
  }

  @Cron(CronExpression.EVERY_30_MINUTES, { name: 'scheduler-settlement-mismatch' })
  async handleSettlementMismatch() {
    await this.executeJob(SchedulerJobName.SETTLEMENT_MISMATCH);
  }

  @Cron('0 8 * * *', { name: 'scheduler-maintenance-reminder' })
  async handleMaintenanceReminder() {
    await this.executeJob(SchedulerJobName.MAINTENANCE_REMINDER);
  }

  @Cron('0 9 * * *', { name: 'scheduler-warranty-reminder' })
  async handleWarrantyReminder() {
    await this.executeJob(SchedulerJobName.WARRANTY_REMINDER);
  }

  @Cron('0 10 * * *', { name: 'scheduler-document-expiry' })
  async handleDocumentExpiry() {
    await this.executeJob(SchedulerJobName.DOCUMENT_EXPIRY);
  }

  @Cron('0 2 * * *', { name: 'scheduler-hgs-sync' })
  async handleHgsSync() {
    await this.executeJob(SchedulerJobName.HGS_SYNC);
  }

  @Cron('0 3 * * *', { name: 'scheduler-import-cleanup' })
  async handleImportCleanup() {
    await this.executeJob(SchedulerJobName.IMPORT_CLEANUP);
  }

  private async executeJob(
    jobName: SchedulerJobName,
    rethrowOnError = false,
  ): Promise<Record<string, unknown> | undefined> {
    const state = this.jobStates.get(jobName)!;
    const startedAt = Date.now();

    this.logger.log(`Scheduler job "${jobName}" started`);
    state.status = SchedulerJobStatus.RUNNING;
    state.lastError = undefined;

    try {
      const result = await this.dispatchJob(jobName);
      state.status = SchedulerJobStatus.SUCCESS;
      state.lastRunAt = new Date();
      state.lastDurationMs = Date.now() - startedAt;
      this.logger.log(
        `Scheduler job "${jobName}" finished in ${state.lastDurationMs}ms`,
      );
      this.refreshNextRun(jobName);
      return result;
    } catch (error) {
      state.status = SchedulerJobStatus.FAILED;
      state.lastRunAt = new Date();
      state.lastDurationMs = Date.now() - startedAt;
      state.lastError = error instanceof Error ? error.message : String(error);
      this.logger.error(`Scheduler job "${jobName}" failed: ${state.lastError}`);
      this.refreshNextRun(jobName);
      if (rethrowOnError) throw error;
      return undefined;
    }
  }

  private async dispatchJob(jobName: SchedulerJobName): Promise<Record<string, unknown>> {
    switch (jobName) {
      case SchedulerJobName.REMINDER_ALL_CHECKS:
        return this.reminderService.runAllChecks() as unknown as Record<string, unknown>;

      case SchedulerJobName.MISSING_DRIVER_REPORTS: {
        const processed = await this.reminderService.checkMissingDriverReports();
        return { processed };
      }

      case SchedulerJobName.SETTLEMENT_MISMATCH: {
        const processed = await this.reminderService.checkSettlementMismatch();
        return { processed };
      }

      case SchedulerJobName.MAINTENANCE_REMINDER: {
        const processed = await this.reminderService.checkMaintenance();
        return { processed };
      }

      case SchedulerJobName.WARRANTY_REMINDER: {
        const processed = await this.reminderService.checkWarranty();
        return { processed };
      }

      case SchedulerJobName.DOCUMENT_EXPIRY: {
        const notified = await this.documentsService.checkExpiringDocuments();
        return { notified };
      }

      case SchedulerJobName.HGS_SYNC: {
        const result = await this.hgsService.syncRecords([]);
        return { ...result };
      }

      case SchedulerJobName.IMPORT_CLEANUP: {
        const archived = await this.importService.archiveOldCompletedImports();
        return { archived };
      }

      default:
        throw new NotFoundException(`Scheduler job "${jobName}" not found`);
    }
  }

  private toJobDto(jobName: SchedulerJobName): SchedulerJobDto {
    const definition = JOB_DEFINITIONS.find((job) => job.name === jobName)!;
    const state = this.jobStates.get(jobName)!;

    return {
      name: jobName,
      label: definition.label,
      schedule: definition.schedule,
      status: state.status,
      lastRunAt: state.lastRunAt ?? null,
      nextRunAt: state.nextRunAt ?? null,
      lastDurationMs: state.lastDurationMs ?? null,
      lastError: state.lastError ?? null,
    };
  }

  private refreshNextRun(jobName: SchedulerJobName) {
    const state = this.jobStates.get(jobName);
    if (!state) return;

    try {
      const cronJob = this.schedulerRegistry.getCronJob(state.cronName);
      const next = cronJob.nextDate();
      state.nextRunAt = next ? next.toJSDate() : undefined;
    } catch {
      state.nextRunAt = undefined;
    }
  }
}
