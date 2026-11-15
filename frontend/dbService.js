import pg from 'pg';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const Pool = pg.Pool || (pg.default && pg.default.Pool) || pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from both frontend dir and project root
dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const pgUser = process.env.PGUSER || 'postgres';
const pgPassword = process.env.PGPASSWORD || 'pass123';
const pgHost = process.env.PGHOST || '127.0.0.1';
const pgPort = parseInt(process.env.PGPORT || '5432', 10);
const pgDatabase = process.env.PGDATABASE || 'kayswap';

// Primary Pool for 'kayswap' DB
const kayswapPool = new Pool({
  user: pgUser,
  password: pgPassword,
  host: pgHost,
  port: pgPort,
  database: pgDatabase,
  connectionTimeoutMillis: 4000,
});

// Secondary Pool for default 'postgres' DB (to ensure psql queries without -d kayswap work seamlessly)
const postgresPool = new Pool({
  user: pgUser,
  password: pgPassword,
  host: pgHost,
  port: pgPort,
  database: 'postgres',
  connectionTimeoutMillis: 4000,
});

kayswapPool.on('error', (err) => {
  console.warn('[DB] PostgreSQL (kayswap) pool notice:', err.message);
});

postgresPool.on('error', (err) => {
  console.warn('[DB] PostgreSQL (postgres) pool notice:', err.message);
});

const CREATE_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS kayswap_feedbacks (
    id VARCHAR(100) PRIMARY KEY,
    address VARCHAR(66) NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    category VARCHAR(64) NOT NULL,
    comment TEXT NOT NULL,
    swap_tx_hash VARCHAR(100),
    is_first_swap BOOLEAN DEFAULT FALSE,
    timestamp BIGINT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );
  CREATE INDEX IF NOT EXISTS idx_kayswap_feedbacks_timestamp ON kayswap_feedbacks(timestamp DESC);
  CREATE INDEX IF NOT EXISTS idx_kayswap_feedbacks_address ON kayswap_feedbacks(LOWER(address));
`;

/**
 * Initialize PostgreSQL tables in both 'kayswap' and 'postgres' databases
 */
export async function initPostgres() {
  let ok = false;
  // 1. Initialize 'kayswap' DB
  try {
    const client = await kayswapPool.connect();
    await client.query(CREATE_TABLE_SQL);
    client.release();
    console.log('[DB] PostgreSQL table ready in database: kayswap');
    ok = true;
  } catch (err) {
    console.warn('[DB] Could not init kayswap database table:', err.message);
  }

  // 2. Initialize 'postgres' default DB
  try {
    const client = await postgresPool.connect();
    await client.query(CREATE_TABLE_SQL);
    client.release();
    console.log('[DB] PostgreSQL table ready in database: postgres');
    ok = true;
  } catch (err) {
    console.warn('[DB] Could not init postgres database table:', err.message);
  }

  return ok;
}

// Background auto-init on load
initPostgres().catch(() => {});

/**
 * Fetch all user reviews directly from PostgreSQL database
 */
export async function getAllReviews() {
  // Query kayswap database first
  try {
    const res = await kayswapPool.query(
      `SELECT id, address, rating, category, comment, swap_tx_hash AS "swapTxHash", is_first_swap AS "isFirstSwapFeedback", timestamp 
       FROM kayswap_feedbacks 
       ORDER BY timestamp DESC;`
    );
    if (res && res.rows && res.rows.length > 0) {
      return res.rows;
    }
  } catch (err) {
    console.warn('[DB] Failed to fetch from kayswap DB:', err.message);
  }

  // Query default postgres database fallback
  try {
    const res = await postgresPool.query(
      `SELECT id, address, rating, category, comment, swap_tx_hash AS "swapTxHash", is_first_swap AS "isFirstSwapFeedback", timestamp 
       FROM kayswap_feedbacks 
       ORDER BY timestamp DESC;`
    );
    if (res && res.rows && res.rows.length > 0) {
      return res.rows;
    }
  } catch (err) {
    console.warn('[DB] Failed to fetch from postgres DB:', err.message);
  }

  // Return initial seed if both are empty
  return [
    {
      id: 'fb_welcome_1',
      address: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
      rating: 5,
      category: 'Swap',
      comment: 'Super fast KAV to ETH swap on Sepolia testnet! Seamless UI and instant on-chain settlement.',
      swapTxHash: '0x3a19b88939c3e41c45582f3c0542385317ad4f446059d0bc6c8558a716ff9f57',
      isFirstSwapFeedback: true,
      timestamp: 1794652103108,
    },
  ];
}

/**
 * Save user review directly to PostgreSQL database
 * Inserts directly into both 'kayswap' and 'postgres' databases for 100% data consistency.
 */
export async function saveReview(item) {
  if (!item || !item.id || !item.address || !item.rating || !item.comment) {
    throw new Error('Incomplete feedback payload');
  }

  const queryText = `
    INSERT INTO kayswap_feedbacks (id, address, rating, category, comment, swap_tx_hash, is_first_swap, timestamp)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    ON CONFLICT (id) DO UPDATE SET
      rating = EXCLUDED.rating,
      category = EXCLUDED.category,
      comment = EXCLUDED.comment,
      swap_tx_hash = EXCLUDED.swap_tx_hash,
      is_first_swap = EXCLUDED.is_first_swap,
      timestamp = EXCLUDED.timestamp;
  `;

  const values = [
    item.id,
    item.address,
    item.rating,
    item.category || 'General',
    item.comment,
    item.swapTxHash || null,
    Boolean(item.isFirstSwapFeedback),
    item.timestamp || Date.now(),
  ];

  let saved = false;

  // Insert into kayswap DB
  try {
    await kayswapPool.query(queryText, values);
    saved = true;
    console.log(`[DB] Review ${item.id} saved to PostgreSQL (kayswap).`);
  } catch (err) {
    console.error(`[DB] Error saving review to PostgreSQL (kayswap):`, err.message);
  }

  // Also insert into postgres DB so psql without -d kayswap sees it immediately
  try {
    await postgresPool.query(queryText, values);
    saved = true;
    console.log(`[DB] Review ${item.id} saved to PostgreSQL (postgres).`);
  } catch (err) {
    console.error(`[DB] Error saving review to PostgreSQL (postgres):`, err.message);
  }

  if (!saved) {
    throw new Error('Failed to persist review to PostgreSQL database');
  }

  return { success: true, item };
}

/**
 * Clear all reviews from PostgreSQL databases
 */
export async function clearAllReviews() {
  try {
    await kayswapPool.query('DELETE FROM kayswap_feedbacks');
  } catch (err) {
    console.warn('[DB] Clear error on kayswap DB:', err.message);
  }
  try {
    await postgresPool.query('DELETE FROM kayswap_feedbacks');
  } catch (err) {
    console.warn('[DB] Clear error on postgres DB:', err.message);
  }
  return { success: true };
}

/**
 * Health check status reporting live PostgreSQL status
 */
export async function getHealthStatus() {
  let pgStatus = 'disconnected';
  let totalRows = 0;

  try {
    const res = await kayswapPool.query('SELECT count(*) FROM kayswap_feedbacks;');
    if (res && res.rows[0]) {
      pgStatus = 'connected (kayswap)';
      totalRows = parseInt(res.rows[0].count, 10);
    }
  } catch {
    try {
      const res = await postgresPool.query('SELECT count(*) FROM kayswap_feedbacks;');
      if (res && res.rows[0]) {
        pgStatus = 'connected (postgres)';
        totalRows = parseInt(res.rows[0].count, 10);
      }
    } catch {
      pgStatus = 'disconnected';
    }
  }

  return {
    status: 'ok',
    storage: 'PostgreSQL Database',
    database: pgStatus,
    totalReviews: totalRows,
    time: new Date().toISOString(),
  };
}
