import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

// Users table
export const users = sqliteTable(
  'users',
  {
    id: text('id').primaryKey(), // UUID as text
    email: text('email', { length: 255 }).notNull().unique(),
    password: text('password', { length: 255 }), // 密码哈希，旧用户可能为空
    isActive: integer('is_active', { mode: 'boolean' }).default(false).notNull(), // 邮箱激活状态
    isAdmin: integer('is_admin', { mode: 'boolean' }).default(false).notNull(), // 管理员权限
    name: text('name', { length: 100 }),
    avatar: text('avatar'), // 头像URL
    bio: text('bio'), // 个人简介
    location: text('location', { length: 100 }), // 所在地区
    website: text('website', { length: 255 }), // 个人网站
    instagram: text('instagram', { length: 100 }), // Instagram账号
    twitter: text('twitter', { length: 100 }), // Twitter/X账号
    createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
    updatedAt: integer('updated_at', { mode: 'timestamp' }),
  },
  (table) => ({
    emailIdx: index('users_email_idx').on(table.email),
  })
);

// Images table
export const images = sqliteTable(
  'images',
  {
    id: text('id').primaryKey(), // UUID as text
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    cosKey: text('cos_key').notNull(),
    exifData: text('exif_data', { mode: 'json' }), // JSON stored as text
    description: text('description'), // User-provided image description
    location: text('location'), // GPS location name (e.g., "Shanghai, China")
    status: text('status', { enum: ['pending', 'approved', 'rejected'] }).default('pending'),
    width: integer('width'),
    height: integer('height'),
    fileSize: integer('file_size'),
    fileHash: text('file_hash'), // MD5 hash for duplicate detection
    likes: integer('likes').default(0),
    downloads: integer('downloads').default(0),
    // Progressive loading fields (Unsplash-style)
    blurHash: text('blur_hash'), // BlurHash string for progressive loading
    dominantColor: text('dominant_color'), // Hex color for instant placeholder
    createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
    updatedAt: integer('updated_at', { mode: 'timestamp' }),
  },
  (table) => ({
    userIdIdx: index('images_user_id_idx').on(table.userId),
    statusIdx: index('images_status_idx').on(table.status),
    createdAtIdx: index('images_created_at_idx').on(table.createdAt),
    fileHashIdx: index('images_file_hash_idx').on(table.fileHash), // For duplicate detection
  })
);

// Downloads table
export const downloads = sqliteTable(
  'downloads',
  {
    id: text('id').primaryKey(), // UUID as text
    imageId: text('image_id')
      .notNull()
      .references(() => images.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    size: text('size', { enum: ['thumb', 'small', 'regular', 'large', 'full', 'original'] }),
    createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  },
  (table) => ({
    imageIdIdx: index('downloads_image_id_idx').on(table.imageId),
    userIdIdx: index('downloads_user_id_idx').on(table.userId),
    createdAtIdx: index('downloads_created_at_idx').on(table.createdAt),
  })
);

// Image embeddings table for semantic search
export const imageEmbeddings = sqliteTable(
  'image_embeddings',
  {
    id: text('id').primaryKey(),
    imageId: text('image_id')
      .notNull()
      .references(() => images.id, { onDelete: 'cascade' }),
    embedding: text('embedding').notNull(), // JSON serialized 512-dim vector
    createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  },
  (table) => ({
    imageIdIdx: index('embeddings_image_id_idx').on(table.imageId),
  })
);

// Relations for imageEmbeddings
export const imageEmbeddingsRelations = relations(imageEmbeddings, ({ one }) => ({
  image: one(images, {
    fields: [imageEmbeddings.imageId],
    references: [images.id],
  }),
}));

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  images: many(images),
  downloads: many(downloads),
}));

export const imagesRelations = relations(images, ({ one, many }) => ({
  user: one(users, {
    fields: [images.userId],
    references: [users.id],
  }),
  downloads: many(downloads),
  embedding: one(imageEmbeddings, {
    fields: [images.id],
    references: [imageEmbeddings.imageId],
  }),
}));

export const downloadsRelations = relations(downloads, ({ one }) => ({
  image: one(images, {
    fields: [downloads.imageId],
    references: [images.id],
  }),
  user: one(users, {
    fields: [downloads.userId],
    references: [users.id],
  }),
}));

// Type exports for TypeScript
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Image = typeof images.$inferSelect;
export type NewImage = typeof images.$inferInsert;
export type Download = typeof downloads.$inferSelect;
export type NewDownload = typeof downloads.$inferInsert;
export type ImageEmbedding = typeof imageEmbeddings.$inferSelect;
export type NewImageEmbedding = typeof imageEmbeddings.$inferInsert;

// Activation tokens table
export const activationTokens = sqliteTable(
  'activation_tokens',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    token: text('token').notNull().unique(),
    expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
    usedAt: integer('used_at', { mode: 'timestamp' }),
    createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  },
  (table) => ({
    userIdIdx: index('activation_tokens_user_id_idx').on(table.userId),
    tokenIdx: index('activation_tokens_token_idx').on(table.token),
  })
);

// Activation tokens relations
export const activationTokensRelations = relations(activationTokens, ({ one }) => ({
  user: one(users, {
    fields: [activationTokens.userId],
    references: [users.id],
  }),
}));

export type ActivationToken = typeof activationTokens.$inferSelect;
export type NewActivationToken = typeof activationTokens.$inferInsert;
