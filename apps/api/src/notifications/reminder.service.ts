import { Injectable, Logger } from '@nestjs/common';
import { ReminderRepository } from './reminder.repository';
import { NotificationsService } from './notifications.service';
import { NotificationType } from '@hanbey-fleet/shared';

export const DEFAULT_MISSING_DRIVER_REPORT_HOURS = 24;
export const DEFAULT_WARRANTY_REMINDER_DAYS = 30;

@Injectable()
export class ReminderService {
  private readonly logger = new Logger(ReminderService.name);

  constructor(
    private reminderRepo: ReminderRepository,
    private notificationsService: NotificationsService,
  ) {}

  async checkMaintenance(): Promise<number> {
    const candidates = await this.reminderRepo.findMaintenanceCandidates();
    let created = 0;

    for (const record of candidates) {
      if (
        record.nextMaintenanceMileage === null ||
        record.vehicle.currentMileage < record.nextMaintenanceMileage
      ) {
        continue;
      }

      await this.notificationsService.notifyFleetManagers({
        type: NotificationType.MAINTENANCE_REMINDER,
        title: 'Maintenance due',
        message: `Vehicle ${record.vehicle.plate} has reached ${record.vehicle.currentMileage} km. Scheduled maintenance at ${record.nextMaintenanceMileage} km.`,
        referenceId: record.id,
        referenceType: 'maintenance',
        metadata: {
          maintenanceRecordId: record.id,
          vehicleId: record.vehicleId,
          vehiclePlate: record.vehicle.plate,
          currentMileage: record.vehicle.currentMileage,
          nextMaintenanceMileage: record.nextMaintenanceMileage,
        },
      });
      created++;
    }

    this.logger.debug(`Maintenance check completed: ${created} notification(s) processed`);
    return created;
  }

  async checkWarranty(
    withinDays: number = DEFAULT_WARRANTY_REMINDER_DAYS,
  ): Promise<number> {
    const records = await this.reminderRepo.findWarrantyExpiring(withinDays);
    let created = 0;

    for (const record of records) {
      if (!record.warrantyUntil) continue;

      const daysLeft = Math.ceil(
        (record.warrantyUntil.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
      );

      await this.notificationsService.notifyFleetManagers({
        type: NotificationType.WARRANTY_REMINDER,
        title: 'Warranty expiring soon',
        message: `Warranty for vehicle ${record.vehicle.plate} (${record.description}) expires in ${daysLeft} day(s).`,
        referenceId: record.id,
        referenceType: 'maintenance',
        metadata: {
          maintenanceRecordId: record.id,
          vehicleId: record.vehicleId,
          vehiclePlate: record.vehicle.plate,
          warrantyUntil: record.warrantyUntil.toISOString(),
          daysLeft,
        },
      });
      created++;
    }

    this.logger.debug(`Warranty check completed: ${created} notification(s) processed`);
    return created;
  }

  async checkMissingDriverReports(
    thresholdHours: number = DEFAULT_MISSING_DRIVER_REPORT_HOURS,
  ): Promise<number> {
    const threshold = new Date(Date.now() - thresholdHours * 60 * 60 * 1000);
    const shifts = await this.reminderRepo.findCompletedShiftsMissingReport(threshold);
    let created = 0;

    for (const shift of shifts) {
      const driverName = shift.driver.user.name;
      const vehiclePlate = shift.vehicle.plate;

      await this.notificationsService.notifyFleetManagers({
        type: NotificationType.DRIVER_REPORT_MISSING,
        title: 'Driver report missing',
        message: `Shift for ${driverName} on vehicle ${vehiclePlate} completed without a driver report.`,
        referenceId: shift.id,
        referenceType: 'shift',
        metadata: {
          shiftId: shift.id,
          vehicleId: shift.vehicleId,
          driverId: shift.driverId,
          vehiclePlate,
          driverName,
          actualEnd: shift.actualEnd?.toISOString(),
        },
      });
      created++;
    }

    this.logger.debug(`Missing driver report check completed: ${created} notification(s) processed`);
    return created;
  }

  async checkSettlementMismatch(): Promise<number> {
    const settlements = await this.reminderRepo.findMismatchSettlements();
    let created = 0;

    for (const settlement of settlements) {
      await this.notificationsService.notifySettlementMismatch(settlement);
      created++;
    }

    this.logger.debug(`Settlement mismatch check completed: ${created} notification(s) processed`);
    return created;
  }

  async runAllChecks(options?: {
    warrantyDays?: number;
    missingReportHours?: number;
  }): Promise<{
    maintenance: number;
    warranty: number;
    missingDriverReports: number;
    settlementMismatch: number;
  }> {
    const [maintenance, warranty, missingDriverReports, settlementMismatch] =
      await Promise.all([
        this.checkMaintenance(),
        this.checkWarranty(options?.warrantyDays),
        this.checkMissingDriverReports(options?.missingReportHours),
        this.checkSettlementMismatch(),
      ]);

    return { maintenance, warranty, missingDriverReports, settlementMismatch };
  }
}
