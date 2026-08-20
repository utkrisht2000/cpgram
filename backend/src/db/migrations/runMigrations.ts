import fs from 'fs';
import path from 'path';
import { db } from '../connection';

export function runMigrations(): void {
  const migrationsDir = path.resolve(__dirname);
  const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();

  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT UNIQUE NOT NULL,
      applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const appliedMigrations = new Set(
    db.prepare('SELECT filename FROM _migrations').all().map((row: any) => row.filename)
  );

  for (const file of files) {
    if (!appliedMigrations.has(file)) {
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
      db.transaction(() => {
        db.exec(sql);
        db.prepare('INSERT INTO _migrations (filename) VALUES (?)').run(file);
      })();
    }
  }
}
