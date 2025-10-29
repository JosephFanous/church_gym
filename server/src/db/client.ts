import Database from 'better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { config } from '../config.js';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const databasePath = path.resolve(currentDir, '../../', config.databasePath);

const directory = path.dirname(databasePath);
if (!fs.existsSync(directory)) {
  fs.mkdirSync(directory, { recursive: true });
}

export const db = new Database(databasePath);
db.pragma('journal_mode = WAL');
