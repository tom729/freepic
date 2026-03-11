import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'sqlite',
  schema: './lib/schema.ts',
  out: './database/migrations',
  dbCredentials: {
    url: './database/sqlite.db',
  },
  verbose: true,
  strict: true,
});
