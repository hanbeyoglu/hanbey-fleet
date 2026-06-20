import { ShiftType } from '@hanbey-fleet/shared';

export interface PlannedShiftTimes {
  type: ShiftType;
  plannedStart: Date;
  plannedEnd: Date;
}

const DAY_SHIFT_START_HOUR = 3;
const DAY_SHIFT_END_HOUR = 15;
const NIGHT_SHIFT_START_HOUR = 15;

function setTime(date: Date, hours: number): Date {
  const result = new Date(date);
  result.setHours(hours, 0, 0, 0);
  return result;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Computes planned shift window from actual start time.
 * DAY: 03:00–15:00, NIGHT: 15:00–03:00 (next day).
 * Uses server local time for business-hour boundaries.
 */
export function computePlannedTimes(actualStart: Date): PlannedShiftTimes {
  const hour = actualStart.getHours();

  if (hour >= DAY_SHIFT_START_HOUR && hour < DAY_SHIFT_END_HOUR) {
    return {
      type: ShiftType.DAY,
      plannedStart: setTime(actualStart, DAY_SHIFT_START_HOUR),
      plannedEnd: setTime(actualStart, DAY_SHIFT_END_HOUR),
    };
  }

  if (hour >= NIGHT_SHIFT_START_HOUR) {
    return {
      type: ShiftType.NIGHT,
      plannedStart: setTime(actualStart, NIGHT_SHIFT_START_HOUR),
      plannedEnd: setTime(addDays(actualStart, 1), DAY_SHIFT_START_HOUR),
    };
  }

  // Before 03:00 — belongs to the night shift that started previous day at 15:00
  const previousDay = addDays(actualStart, -1);
  return {
    type: ShiftType.NIGHT,
    plannedStart: setTime(previousDay, NIGHT_SHIFT_START_HOUR),
    plannedEnd: setTime(actualStart, DAY_SHIFT_START_HOUR),
  };
}
