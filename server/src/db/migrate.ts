import { db } from './client.js';

const migrations = [
  `
  CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT NOT NULL,
    dob TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  )
`,
  `
  CREATE TABLE IF NOT EXISTS reservations (
    id TEXT PRIMARY KEY,
    customer_id INTEGER NOT NULL,
    sport TEXT NOT NULL,
    notes TEXT,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    amount_cents INTEGER NOT NULL,
    payment_method TEXT NOT NULL,
    payment_status TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (customer_id) REFERENCES customers(id)
  )
`,
  `
  CREATE TABLE IF NOT EXISTS reservation_audit (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    reservation_id TEXT NOT NULL,
    action TEXT NOT NULL,
    payload TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (reservation_id) REFERENCES reservations(id)
  )
`
];

for (const sql of migrations) {
  db.exec(sql);
}

console.log('Database migrations executed successfully.');
