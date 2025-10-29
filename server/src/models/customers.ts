import { db } from '../db/client.js';
import type { Customer } from '../types.js';

const mapRow = (row: any): Customer => ({
  id: row.id,
  firstName: row.first_name,
  lastName: row.last_name,
  email: row.email,
  phone: row.phone,
  dob: row.dob,
  createdAt: row.created_at
});

export const findCustomerByEmail = (email: string): Customer | null => {
  const stmt = db.prepare(
    `SELECT * FROM customers WHERE LOWER(email) = LOWER(?) LIMIT 1`
  );
  const row = stmt.get(email);
  return row ? mapRow(row) : null;
};

export const createCustomer = (input: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dob: string;
}): Customer => {
  const stmt = db.prepare(
    `INSERT INTO customers (first_name, last_name, email, phone, dob)
     VALUES (@firstName, @lastName, @email, @phone, @dob)`
  );
  const result = stmt.run({
    firstName: input.firstName,
    lastName: input.lastName,
    email: input.email,
    phone: input.phone,
    dob: input.dob
  });

  const row = db.prepare(`SELECT * FROM customers WHERE id = ?`).get(result.lastInsertRowid);
  if (!row) {
    throw new Error('Failed to load customer after insert');
  }
  return mapRow(row);
};
