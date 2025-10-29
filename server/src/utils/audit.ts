import { db } from '../db/client.js';

export const recordReservationAudit = (reservationId: string, action: string, payload?: any) => {
  const stmt = db.prepare(
    `
    INSERT INTO reservation_audit (reservation_id, action, payload)
    VALUES (@reservationId, @action, @payload)
  `
  );

  try {
    stmt.run({
      reservationId,
      action,
      payload: payload ? JSON.stringify(payload) : null
    });
  } catch (error) {
    const err = error as { code?: string };
    if (err.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
      console.warn(
        `[audit] Skipping audit entry for reservation ${reservationId} because it no longer exists.`
      );
      return;
    }
    throw error;
  }
};
