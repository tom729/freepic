import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

// PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/freepic',
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return error after 2 seconds if connection not established
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
