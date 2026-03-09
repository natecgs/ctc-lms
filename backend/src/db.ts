import { Pool, PoolClient } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'ctc_lms',
  password: process.env.DB_PASSWORD || 'postgres',
  port: parseInt(process.env.DB_PORT || '5432'),
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
  statement_timeout: 30000,
});

// Test connection on pool creation
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('[DB] Connection test failed:', err.message);
  } else {
    console.log('[DB] Connection test successful, current time:', res.rows[0].now);
  }
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

export async function query(text: string, params?: any[]) {
  const start = Date.now();
  console.log(`[DB] Executing query:`, { text: text.substring(0, 100), params });
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log(`[DB] Query completed in ${duration}ms, rows: ${res.rowCount}`);
    return res;
  } catch (error) {
    const duration = Date.now() - start;
    console.error(`[DB] Query failed after ${duration}ms:`, error);
    throw error;
  }
}

export async function getClient(): Promise<PoolClient> {
  return pool.connect();
}

export async function closePool() {
  await pool.end();
}

export default pool;
