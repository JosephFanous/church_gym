import { db } from '../db/client.js';
import type {
  PaymentMethod,
  PaymentStatus,
  Reservation,
  ReservationWithCustomer
} from '../types.js';

const reservationColumns = `
  r.id,
  r.customer_id,
  r.sport,
  r.notes,
  r.start_time,
  r.end_time,
  r.amount_cents,
  r.payment_method,
  r.payment_status,
  r.created_at,
  r.updated_at
`;

const mapReservation = (row: any): Reservation => ({
  id: row.id,
  customerId: row.customer_id,
  sport: row.sport,
  notes: row.notes,
  startTime: row.start_time,
  endTime: row.end_time,
  amountCents: row.amount_cents,
  paymentMethod: row.payment_method,
  paymentStatus: row.payment_status,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

const mapWithCustomer = (row: any): ReservationWithCustomer => ({
  ...mapReservation(row),
  customer: {
    id: row.customer_id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    phone: row.phone,
    dob: row.dob,
    createdAt: row.customer_created_at
  }
});

export const listReservations = ({
  limit = 50,
  offset = 0,
  upcomingOnly = false
}: {
  limit?: number;
  offset?: number;
  upcomingOnly?: boolean;
} = {}): ReservationWithCustomer[] => {
  const stmt = db.prepare(
    `
    SELECT ${reservationColumns},
           c.first_name,
           c.last_name,
           c.email,
           c.phone,
           c.dob,
           c.created_at as customer_created_at
    FROM reservations r
    INNER JOIN customers c on c.id = r.customer_id
    ${upcomingOnly ? "WHERE datetime(r.end_time) >= datetime('now')" : ''}
    ORDER BY datetime(r.start_time) ASC
    LIMIT @limit OFFSET @offset
  `
  );
  return stmt
    .all({
      limit,
      offset
    })
    .map(mapWithCustomer);
};

export const findReservationById = (id: string): ReservationWithCustomer | null => {
  const stmt = db.prepare(
    `
    SELECT ${reservationColumns},
           c.first_name,
           c.last_name,
           c.email,
           c.phone,
           c.dob,
           c.created_at as customer_created_at
    FROM reservations r
    INNER JOIN customers c on c.id = r.customer_id
    WHERE r.id = ?
    LIMIT 1
  `
  );
  const row = stmt.get(id);
  return row ? mapWithCustomer(row) : null;
};

export const findConflictingReservations = (startTime: string, endTime: string) => {
  const stmt = db.prepare(
    `
    SELECT ${reservationColumns}
    FROM reservations r
    WHERE (
      (datetime(r.start_time) < datetime(@endTime) AND datetime(r.end_time) > datetime(@startTime))
    )
    ORDER BY datetime(r.start_time) ASC
  `
  );
  return stmt.all({ startTime, endTime }).map(mapReservation);
};

export const createReservation = (input: {
  id: string;
  customerId: number;
  sport: string;
  notes?: string | null;
  startTime: string;
  endTime: string;
  amountCents: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
}): Reservation => {
  const stmt = db.prepare(
    `
    INSERT INTO reservations (
      id,
      customer_id,
      sport,
      notes,
      start_time,
      end_time,
      amount_cents,
      payment_method,
      payment_status
    )
    VALUES (
      @id,
      @customerId,
      @sport,
      @notes,
      @startTime,
      @endTime,
      @amountCents,
      @paymentMethod,
      @paymentStatus
    )
  `
  );

  stmt.run({
    id: input.id,
    customerId: input.customerId,
    sport: input.sport,
    notes: input.notes ?? null,
    startTime: input.startTime,
    endTime: input.endTime,
    amountCents: input.amountCents,
    paymentMethod: input.paymentMethod,
    paymentStatus: input.paymentStatus
  });

  const row = db
    .prepare(`SELECT ${reservationColumns} FROM reservations r WHERE r.id = ? LIMIT 1`)
    .get(input.id);
  if (!row) {
    throw new Error('Failed to load reservation after insert');
  }
  return mapReservation(row);
};

export const updateReservation = (
  id: string,
  updates: Partial<{
    startTime: string;
    endTime: string;
    notes: string | null;
    paymentStatus: PaymentStatus;
    sport: string;
    amountCents: number;
  }>
): Reservation => {
  const existing = findReservationById(id);
  if (!existing) {
    throw new Error('Reservation not found');
  }

  const merged = {
    ...existing,
    ...updates
  };

  const stmt = db.prepare(
    `
    UPDATE reservations
    SET
      start_time = @startTime,
      end_time = @endTime,
      notes = @notes,
      sport = @sport,
      amount_cents = @amountCents,
      payment_status = @paymentStatus,
      updated_at = datetime('now')
    WHERE id = @id
  `
  );

  stmt.run({
    id,
    startTime: merged.startTime,
    endTime: merged.endTime,
    notes: merged.notes ?? null,
    sport: merged.sport,
    amountCents: merged.amountCents,
    paymentStatus: merged.paymentStatus
  });

  const row = db
    .prepare(`SELECT ${reservationColumns} FROM reservations r WHERE r.id = ? LIMIT 1`)
    .get(id);

  if (!row) {
    throw new Error('Failed to load reservation after update');
  }

  return mapReservation(row);
};

export const deleteReservation = (id: string): void => {
  const deleteAudit = db.prepare(`DELETE FROM reservation_audit WHERE reservation_id = ?`);
  deleteAudit.run(id);

  const stmt = db.prepare(`DELETE FROM reservations WHERE id = ?`);
  stmt.run(id);
};
