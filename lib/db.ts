import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

// Supabase PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10, // Supabase free tier has connection limits
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  ssl: {
    rejectUnauthorized: false, // Required for Supabase
  },
});

// Initialize Drizzle ORM with schema
export const db = drizzle(pool, { schema });

// Export schema for type inference
export type DB = typeof db;
export { schema };

// Connection helper for health checks
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

// Graceful shutdown helper
export async function closeDatabaseConnection(): Promise<void> {
  await pool.end();
}

// Export pool for direct queries if needed
export { pool };
