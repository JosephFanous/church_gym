const MS_IN_MINUTE = 60 * 1000;

export const toIso = (date: Date): string => date.toISOString();

export const roundDownToInterval = (date: Date, minutes: number): Date => {
  const ms = date.getTime();
  const intervalMs = minutes * MS_IN_MINUTE;
  return new Date(Math.floor(ms / intervalMs) * intervalMs);
};

export const addMinutes = (date: Date, minutes: number): Date =>
  new Date(date.getTime() + minutes * MS_IN_MINUTE);

export const overlaps = (startA: Date, endA: Date, startB: Date, endB: Date): boolean =>
  startA < endB && startB < endA;
