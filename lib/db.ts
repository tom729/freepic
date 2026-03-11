import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';
import path from 'path';

// Initialize SQLite database with absolute path
const sqlite = new Database(path.join(process.cwd(), 'database', 'sqlite.db'));


// Enable WAL mode for better performance
sqlite.pragma('journal_mode = WAL');

// Initialize Drizzle ORM with schema
export const db = drizzle(sqlite, { schema });

// Export schema for type inference
export type DB = typeof db;
export { schema };

// Connection helper for health checks
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    sqlite.prepare('SELECT 1').get();
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

// Graceful shutdown helper
export async function closeDatabaseConnection(): Promise<void> {
  sqlite.close();
}
