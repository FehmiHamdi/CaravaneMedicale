import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, 'caravan.db'));
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS specialties (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS patients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    queue_number INTEGER NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    age INTEGER,
    phone TEXT,
    address TEXT,
    specialty_id INTEGER,
    status TEXT NOT NULL DEFAULT 'registered',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (specialty_id) REFERENCES specialties(id) ON DELETE SET NULL
  );
`);

const specialtyCount = db.prepare('SELECT COUNT(*) as c FROM specialties').get().c;
if (specialtyCount === 0) {
  const seed = ['طب عام', 'طب أطفال', 'طب نساء وتوليد', 'طب أسنان', 'طب عيون', 'صيدلية'];
  const insert = db.prepare('INSERT INTO specialties (name) VALUES (?)');
  const seedTx = db.transaction((names) => {
    names.forEach((n) => insert.run(n));
  });
  seedTx(seed);
}

export default db;
