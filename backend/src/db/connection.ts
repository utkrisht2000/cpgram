import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { env } from '../config/env';

// Ensure database directory exists before connecting
const dbDir = path.dirname(env.databasePath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export const db = new Database(env.databasePath);

// Enable WAL mode and foreign keys for data integrity and concurrency
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export default db;
