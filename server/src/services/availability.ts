import { findConflictingReservations } from '../models/reservations.js';
import type { AvailabilitySlot } from '../types.js';

const DEFAULT_SLOT_MINUTES = 60;
const OPENING_HOUR = 8;
const CLOSING_HOUR = 22;
const MINUTES_PER_DAY = 24 * 60;

const startOfDay = (date: Date): Date => {
  const clone = new Date(date);
  clone.setHours(0, 0, 0, 0);
  return clone;
};

const setTime = (date: Date, hours: number, minutes = 0): Date => {
  const clone = new Date(date);
  clone.setHours(hours, minutes, 0, 0);
  return clone;
};

const addDays = (date: Date, days: number): Date =>
  new Date(date.getTime() + days * MINUTES_PER_DAY * 60 * 1000);

export const generateAvailability = (
  start: Date,
  end: Date,
  slotMinutes: number = DEFAULT_SLOT_MINUTES
): AvailabilitySlot[] => {
  if (end <= start || slotMinutes <= 0) {
    return [];
  }

  const startMs = start.getTime();
  const endMs = end.getTime();

  const reservations = findConflictingReservations(start.toISOString(), end.toISOString()).map(
    (reservation) => ({
      start: new Date(reservation.startTime).getTime(),
      end: new Date(reservation.endTime).getTime()
    })
  );

  const slots: AvailabilitySlot[] = [];
  let currentDay = startOfDay(start);
  let safetyCounter = 0;

  while (currentDay.getTime() < endMs && safetyCounter < 400) {
    safetyCounter += 1;
    const open = setTime(currentDay, OPENING_HOUR);
    const close = setTime(currentDay, CLOSING_HOUR);

    let slotStartMs = Math.max(open.getTime(), startMs);

    if (slotStartMs >= close.getTime()) {
      currentDay = addDays(currentDay, 1);
      continue;
    }

    while (slotStartMs < close.getTime() && slotStartMs < endMs) {
      const slotEndMs = slotStartMs + slotMinutes * 60 * 1000;
      if (slotEndMs > close.getTime() || slotEndMs > endMs) {
        break;
      }

      const hasConflict = reservations.some(
        (reservation) => slotStartMs < reservation.end && reservation.start < slotEndMs
      );

      if (!hasConflict) {
        slots.push({
          startTime: new Date(slotStartMs).toISOString(),
          endTime: new Date(slotEndMs).toISOString()
        });
      }

      slotStartMs = slotEndMs;
    }

    currentDay = startOfDay(addDays(currentDay, 1));
  }

  return slots;
};
