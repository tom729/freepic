import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

// Supabase PostgreSQL connection with retry logic
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
  min: 1,
  idleTimeoutMillis: 60000,
  connectionTimeoutMillis: 10000,
  ssl: {
    rejectUnauthorized: false,
  },
  allowExitOnIdle: false,

});


// Handle pool errors
pool.on('error', (err) => {
  console.error('Unexpected database pool error:', err);
});

// Test connection on startup
pool
  .connect()
  .then((client) => {
    console.log('[DB] Database connected successfully');
    client.release();
  })
  .catch((err) => {
    console.error('[DB] Initial connection failed:', err);
  });

// Initialize Drizzle ORM with schema
export const db = drizzle(pool, { schema });

// Export schema for type inference
export type DB = typeof db;
export { schema };

// Connection helper with retry
export async function checkDatabaseConnection(retries = 3): Promise<boolean> {
  for (let i = 0; i < retries; i++) {
    try {
      const client = await pool.connect();
      await client.query('SELECT 1');
      client.release();
      return true;
    } catch (error) {
      console.error(`[DB] Connection attempt ${i + 1} failed:`, error);
      if (i === retries - 1) return false;
      // Wait before retry
      await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
  return false;
}

// Graceful shutdown helper
export async function closeDatabaseConnection(): Promise<void> {
  await pool.end();
}

// Export pool for direct queries if needed
export { pool };
