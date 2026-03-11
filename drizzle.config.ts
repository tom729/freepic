import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',
  schema: './lib/schema.ts',
  out: './database/migrations',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'postgresql://localhost:5432/freepic',
  },
  verbose: true,
  strict: true,
});
