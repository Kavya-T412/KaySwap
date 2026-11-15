import pg from 'pg';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const pgUser = process.env.PGUSER || 'postgres';
const pgPassword = process.env.PGPASSWORD || 'pass123';
const pgHost = process.env.PGHOST || '127.0.0.1';
const pgPort = parseInt(process.env.PGPORT || '5432', 10);

async function syncAndVerifyDatabase(dbName) {
  const client = new Client({
    user: pgUser,
    host: pgHost,
    database: dbName,
    password: pgPassword,
    port: pgPort,
  });

  try {
    await client.connect();
    console.log(`[PostgreSQL] Connected to database: [${dbName}]`);

    await client.query(`
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
      CREATE INDEX IF NOT EXISTS idx_${dbName}_fb_ts ON kayswap_feedbacks(timestamp DESC);
      CREATE INDEX IF NOT EXISTS idx_${dbName}_fb_addr ON kayswap_feedbacks(LOWER(address));
    `);

    // Clean up temporary test entries
    await client.query("DELETE FROM kayswap_feedbacks WHERE id LIKE 'test_%' OR id LIKE 'fb_live_test_%'");

    const countRes = await client.query('SELECT count(*) FROM kayswap_feedbacks;');
    console.log(`[PostgreSQL] [${dbName}] has ${countRes.rows[0].count} verified feedback rows.`);
    await client.end();
  } catch (err) {
    console.error(`[PostgreSQL] Error in [${dbName}]:`, err.message);
    try { await client.end(); } catch {}
  }
}

async function run() {
  await syncAndVerifyDatabase('kayswap');
  await syncAndVerifyDatabase('postgres');
  console.log('[PostgreSQL] Database verification and synchronization completed successfully.');
}

run();
