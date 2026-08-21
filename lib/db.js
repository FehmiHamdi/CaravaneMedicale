import { Pool } from 'pg';

const isLocal = /localhost|127\.0\.0\.1/.test(process.env.DATABASE_URL || '');

const globalForPg = globalThis;

export const pool =
  globalForPg._pgPool ||
  new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: isLocal ? undefined : { rejectUnauthorized: false },
    max: 3,
  });

globalForPg._pgPool = pool;

let schemaReady = null;

function initSchema() {
  return pool
    .query(`
      CREATE SEQUENCE IF NOT EXISTS patients_registration_seq;

      CREATE TABLE IF NOT EXISTS specialties (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS patients (
        id SERIAL PRIMARY KEY,
        registration_number INTEGER NOT NULL DEFAULT nextval('patients_registration_seq'),
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        age INTEGER,
        phone TEXT,
        address TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS patient_specialties (
        id SERIAL PRIMARY KEY,
        patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
        specialty_id INTEGER NOT NULL REFERENCES specialties(id) ON DELETE CASCADE,
        specialty_queue_number INTEGER NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (patient_id, specialty_id)
      );
    `)
    .then(async () => {
      const { rows } = await pool.query('SELECT COUNT(*)::int AS c FROM specialties');
      if (rows[0].c === 0) {
        const seed = ['طب عام', 'طب أطفال', 'طب نساء وتوليد', 'طب أسنان', 'طب عيون', 'صيدلية'];
        for (const name of seed) {
          await pool.query('INSERT INTO specialties (name) VALUES ($1) ON CONFLICT DO NOTHING', [name]);
        }
      }
    });
}

export function ensureSchema() {
  if (!schemaReady) {
    schemaReady = initSchema().catch((err) => {
      schemaReady = null;
      throw err;
    });
  }
  return schemaReady;
}

export async function getPool() {
  await ensureSchema();
  return pool;
}
