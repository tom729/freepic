/**
 * SQLite to PostgreSQL Migration Script
 *
 * Usage: npx tsx scripts/migrate-sqlite-to-postgres.ts
 */

import { Database } from 'better-sqlite3';
import { Pool } from 'pg';
import * as path from 'path';

// SQLite connection
const sqliteDb = new Database(path.join(process.cwd(), 'database', 'sqlite.db'));

// PostgreSQL connection
const pgPool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/freepic',
});

async function migrate() {
  console.log('🚀 Starting migration from SQLite to PostgreSQL...\n');

  const client = await pgPool.connect();

  try {
    // Migrate Users
    console.log('📦 Migrating users...');
    const users = sqliteDb.prepare('SELECT * FROM users').all();
    for (const user of users) {
      await client.query(
        `
        INSERT INTO users (id, email, password, is_active, is_admin, name, avatar, bio, location, website, instagram, twitter, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        ON CONFLICT (id) DO NOTHING
      `,
        [
          user.id,
          user.email,
          user.password,
          user.is_active,
          user.is_admin,
          user.name,
          user.avatar,
          user.bio,
          user.location,
          user.website,
          user.instagram,
          user.twitter,
          user.created_at ? new Date(user.created_at) : new Date(),
          user.updated_at ? new Date(user.updated_at) : null,
        ]
      );
    }
    console.log(`   ✅ Migrated ${users.length} users\n`);

    // Migrate Images
    console.log('📦 Migrating images...');
    const images = sqliteDb.prepare('SELECT * FROM images').all();
    for (const img of images) {
      await client.query(
        `
        INSERT INTO images (id, user_id, cos_key, exif_data, description, location, status, width, height, file_size, file_hash, likes, downloads, blur_hash, dominant_color, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        ON CONFLICT (id) DO NOTHING
      `,
        [
          img.id,
          img.user_id,
          img.cos_key,
          img.exif_data ? JSON.parse(img.exif_data) : null,
          img.description,
          img.location,
          img.status,
          img.width,
          img.height,
          img.file_size,
          img.file_hash,
          img.likes || 0,
          img.downloads || 0,
          img.blur_hash,
          img.dominant_color,
          img.created_at ? new Date(img.created_at) : new Date(),
          img.updated_at ? new Date(img.updated_at) : null,
        ]
      );
    }
    console.log(`   ✅ Migrated ${images.length} images\n`);

    // Migrate Downloads
    console.log('📦 Migrating downloads...');
    const downloads = sqliteDb.prepare('SELECT * FROM downloads').all();
    for (const dl of downloads) {
      await client.query(
        `
        INSERT INTO downloads (id, image_id, user_id, size, created_at)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (id) DO NOTHING
      `,
        [
          dl.id,
          dl.image_id,
          dl.user_id,
          dl.size,
          dl.created_at ? new Date(dl.created_at) : new Date(),
        ]
      );
    }
    console.log(`   ✅ Migrated ${downloads.length} downloads\n`);

    // Migrate Image Embeddings
    console.log('📦 Migrating image embeddings...');
    const embeddings = sqliteDb.prepare('SELECT * FROM image_embeddings').all();
    for (const emb of embeddings) {
      await client.query(
        `
        INSERT INTO image_embeddings (id, image_id, embedding, created_at)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (id) DO NOTHING
      `,
        [
          emb.id,
          emb.image_id,
          emb.embedding ? JSON.parse(emb.embedding) : null,
          emb.created_at ? new Date(emb.created_at) : new Date(),
        ]
      );
    }
    console.log(`   ✅ Migrated ${embeddings.length} embeddings\n`);

    // Migrate Activation Tokens
    console.log('📦 Migrating activation tokens...');
    const tokens = sqliteDb.prepare('SELECT * FROM activation_tokens').all();
    for (const token of tokens) {
      await client.query(
        `
        INSERT INTO activation_tokens (id, user_id, token, expires_at, used_at, created_at)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (id) DO NOTHING
      `,
        [
          token.id,
          token.user_id,
          token.token,
          token.expires_at ? new Date(token.expires_at) : new Date(),
          token.used_at ? new Date(token.used_at) : null,
          token.created_at ? new Date(token.created_at) : new Date(),
        ]
      );
    }
    console.log(`   ✅ Migrated ${tokens.length} activation tokens\n`);

    console.log('✨ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
    sqliteDb.close();
    await pgPool.end();
  }
}

migrate().catch(console.error);
