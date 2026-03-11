import { pgTable, text, integer, index, timestamp, jsonb, boolean, unique } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Users table
export const users = pgTable(
  'users',
  {
    id: text('id').primaryKey(), // UUID as text
    email: text('email', { length: 255 }).notNull().unique(),
    password: text('password', { length: 255 }), // 密码哈希，旧用户可能为空
    isActive: boolean('is_active').default(false).notNull(), // 邮箱激活状态
    isAdmin: boolean('is_admin').default(false).notNull(), // 管理员权限
    name: text('name', { length: 100 }),
    avatar: text('avatar'), // 头像URL
    bio: text('bio'), // 个人简介
    location: text('location', { length: 100 }), // 所在地区
    website: text('website', { length: 255 }), // 个人网站
    instagram: text('instagram', { length: 100 }), // Instagram账号
    twitter: text('twitter', { length: 100 }), // Twitter/X账号
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }),
  },
  (table) => ({
    emailIdx: index('users_email_idx').on(table.email),
  })
);

// Images table
export const images = pgTable(
  'images',
  {
    id: text('id').primaryKey(), // UUID as text
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    cosKey: text('cos_key').notNull(),
    exifData: jsonb('exif_data'), // JSONB for better performance
    description: text('description'), // User-provided image description
    location: text('location'), // GPS location name (e.g., "Shanghai, China")
    status: text('status', { enum: ['pending', 'approved', 'rejected'] })
      .default('pending')
      .notNull(),
    width: integer('width'),
    height: integer('height'),
    fileSize: integer('file_size'),
    fileHash: text('file_hash'), // MD5 hash for duplicate detection
    likes: integer('likes').default(0),
    downloads: integer('downloads').default(0),
    // Progressive loading fields (Unsplash-style)
    blurHash: text('blur_hash'), // BlurHash string for progressive loading
    dominantColor: text('dominant_color'), // Hex color for instant placeholder
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }),
  },
  (table) => ({
    userIdIdx: index('images_user_id_idx').on(table.userId),
    statusIdx: index('images_status_idx').on(table.status),
    createdAtIdx: index('images_created_at_idx').on(table.createdAt),
    fileHashIdx: index('images_file_hash_idx').on(table.fileHash), // For duplicate detection
  })
);

// Downloads table
export const downloads = pgTable(
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
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    imageIdIdx: index('downloads_image_id_idx').on(table.imageId),
    userIdIdx: index('downloads_user_id_idx').on(table.userId),
    createdAtIdx: index('downloads_created_at_idx').on(table.createdAt),
  })
);

// Image embeddings table for semantic search
export const imageEmbeddings = pgTable(
  'image_embeddings',
  {
    id: text('id').primaryKey(),
    imageId: text('image_id')
      .notNull()
      .references(() => images.id, { onDelete: 'cascade' }),
    embedding: jsonb('embedding').notNull(), // JSONB serialized vector
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
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
  views: many(imageViews),
  collections: many(collections),
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
  views: many(imageViews),
  viewAggregates: many(imageViewAggregates),
  imageTags: many(imageTags),
  collectionImages: many(collectionImages),
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
export const activationTokens = pgTable(
  'activation_tokens',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    token: text('token').notNull().unique(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    usedAt: timestamp('used_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
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


// Image views table for analytics tracking with privacy protection
export const imageViews = pgTable(
  'image_views',
  {
    id: text('id').primaryKey(), // UUID as text
    imageId: text('image_id')
      .notNull()
      .references(() => images.id, { onDelete: 'cascade' }),
    userId: text('user_id').references(() => users.id, { onDelete: 'set null' }), // Nullable for anonymous users
    sessionId: text('session_id'), // For anonymous tracking
    ipHash: text('ip_hash'), // Hashed IP for privacy (never store raw IP)
    userAgent: text('user_agent'), // Browser/user agent info
    referrer: text('referrer'), // Where user came from
    viewedAt: timestamp('viewed_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    imageIdIdx: index('image_views_image_id_idx').on(table.imageId),
    userIdIdx: index('image_views_user_id_idx').on(table.userId),
    viewedAtIdx: index('image_views_viewed_at_idx').on(table.viewedAt),
    sessionIdIdx: index('image_views_session_id_idx').on(table.sessionId),
    // Composite index for deduplication queries
    imageUserIdx: index('image_views_image_user_idx').on(table.imageId, table.userId),
    imageSessionIdx: index('image_views_image_session_idx').on(table.imageId, table.sessionId),
  })
);

// Image view aggregates for fast analytics queries
export const imageViewAggregates = pgTable(
  'image_view_aggregates',
  {
    id: text('id').primaryKey(), // UUID as text
    imageId: text('image_id')
      .notNull()
      .references(() => images.id, { onDelete: 'cascade' }),
    date: timestamp('date', { withTimezone: true }).notNull(), // Date (truncated to day)
    totalViews: integer('total_views').default(0).notNull(), // Total view count
    uniqueViews: integer('unique_views').default(0).notNull(), // Unique viewer count
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }),
  },
  (table) => ({
    imageIdIdx: index('image_view_aggregates_image_id_idx').on(table.imageId),
    dateIdx: index('image_view_aggregates_date_idx').on(table.date),
    // Composite unique constraint for idempotent aggregation
    imageDateUnique: unique('image_view_aggregates_image_date_unique').on(table.imageId, table.date),
  }),
);

// Relations for imageViews
export const imageViewsRelations = relations(imageViews, ({ one }) => ({
  image: one(images, {
    fields: [imageViews.imageId],
    references: [images.id],
  }),
  user: one(users, {
    fields: [imageViews.userId],
    references: [users.id],
  }),
}));

// Relations for imageViewAggregates
export const imageViewAggregatesRelations = relations(imageViewAggregates, ({ one }) => ({
  image: one(images, {
    fields: [imageViewAggregates.imageId],
    references: [images.id],
  }),
}));

// Type exports for TypeScript
export type ImageView = typeof imageViews.$inferSelect;
export type NewImageView = typeof imageViews.$inferInsert;
export type ImageViewAggregate = typeof imageViewAggregates.$inferSelect;
export type NewImageViewAggregate = typeof imageViewAggregates.$inferInsert;

// Featured Collections table (admin-curated collections for homepage)
export const featuredCollections = pgTable(
  'featured_collections',
  {
    id: text('id').primaryKey(), // UUID as text
    title: text('title').notNull(), // Collection title
    description: text('description'), // Optional description
    coverImageId: text('cover_image_id').references(() => images.id, { onDelete: 'set null' }), // Cover image reference
    curatorId: text('curator_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }), // Admin who created it
    displayOrder: integer('display_order').default(0).notNull(), // Order for homepage display
    isActive: boolean('is_active').default(true).notNull(), // Whether collection is active
    startDate: timestamp('start_date', { withTimezone: true }), // Optional start date for scheduling
    endDate: timestamp('end_date', { withTimezone: true }), // Optional end date for scheduling
    imageCount: integer('image_count').default(0).notNull(), // Cached count of images
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }),
  },
  (table) => ({
    isActiveIdx: index('featured_collections_is_active_idx').on(table.isActive),
    displayOrderIdx: index('featured_collections_display_order_idx').on(table.displayOrder),
    startDateIdx: index('featured_collections_start_date_idx').on(table.startDate),
    endDateIdx: index('featured_collections_end_date_idx').on(table.endDate),
    curatorIdIdx: index('featured_collections_curator_id_idx').on(table.curatorId),
    coverImageIdIdx: index('featured_collections_cover_image_id_idx').on(table.coverImageId),
  })
);

// Featured Collection Images junction table
export const featuredCollectionImages = pgTable(
  'featured_collection_images',
  {
    id: text('id').primaryKey(), // UUID as text
    featuredCollectionId: text('featured_collection_id')
      .notNull()
      .references(() => featuredCollections.id, { onDelete: 'cascade' }),
    imageId: text('image_id')
      .notNull()
      .references(() => images.id, { onDelete: 'cascade' }),
    addedAt: timestamp('added_at', { withTimezone: true }).defaultNow().notNull(),
    order: integer('order').default(0).notNull(), // Order within collection
  },
  (table) => ({
    collectionIdIdx: index('featured_collection_images_collection_id_idx').on(table.featuredCollectionId),
    imageIdIdx: index('featured_collection_images_image_id_idx').on(table.imageId),
    uniqueCollectionImage: unique('featured_collection_images_unique_idx').on(table.featuredCollectionId, table.imageId),
  }));

// Relations for featured collections
export const featuredCollectionsRelations = relations(featuredCollections, ({ one, many }) => ({
  curator: one(users, {
    fields: [featuredCollections.curatorId],
    references: [users.id],
  }),
  coverImage: one(images, {
    fields: [featuredCollections.coverImageId],
    references: [images.id],
  }),
  images: many(featuredCollectionImages),
}));

// Relations for featured collection images junction
export const featuredCollectionImagesRelations = relations(featuredCollectionImages, ({ one }) => ({
  collection: one(featuredCollections, {
    fields: [featuredCollectionImages.featuredCollectionId],
    references: [featuredCollections.id],
  }),
  image: one(images, {
    fields: [featuredCollectionImages.imageId],
    references: [images.id],
  }),
}));

// Type exports for featured collections
export type FeaturedCollection = typeof featuredCollections.$inferSelect;
export type NewFeaturedCollection = typeof featuredCollections.$inferInsert;
export type FeaturedCollectionImage = typeof featuredCollectionImages.$inferSelect;
export type NewFeaturedCollectionImage = typeof featuredCollectionImages.$inferInsert;

// Tags table
export const tags = pgTable(
  'tags',
  {
    id: text('id').primaryKey(), // UUID as text
    name: text('name', { length: 100 }).notNull().unique(),
    slug: text('slug', { length: 100 }).notNull().unique(),
    description: text('description'),
    color: text('color', { length: 7 }), // Hex color for tag
    imageCount: integer('image_count').default(0).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    nameIdx: index('tags_name_idx').on(table.name),
    slugIdx: index('tags_slug_idx').on(table.slug),
  })
);

// Image Tags junction table (many-to-many)
export const imageTags = pgTable(
  'image_tags',
  {
    id: text('id').primaryKey(), // UUID as text
    imageId: text('image_id')
      .notNull()
      .references(() => images.id, { onDelete: 'cascade' }),
    tagId: text('tag_id')
      .notNull()
      .references(() => tags.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    imageIdIdx: index('image_tags_image_id_idx').on(table.imageId),
    tagIdIdx: index('image_tags_tag_id_idx').on(table.tagId),
    uniqueImageTag: unique('image_tags_unique_idx').on(table.imageId, table.tagId),
  })
);

// Tags relations
export const tagsRelations = relations(tags, ({ many }) => ({
  imageTags: many(imageTags),
}));

// ImageTags relations
export const imageTagsRelations = relations(imageTags, ({ one }) => ({
  tag: one(tags, {
    fields: [imageTags.tagId],
    references: [tags.id],
  }),
  image: one(images, {
    fields: [imageTags.imageId],
    references: [images.id],
  }),
}));

// Type exports for Tags

// Type exports for Tags
export type Tag = typeof tags.$inferSelect;
export type NewTag = typeof tags.$inferInsert;
export type ImageTag = typeof imageTags.$inferSelect;
export type NewImageTag = typeof imageTags.$inferInsert;


// User Collections table (personal collections)
export const collections = pgTable(
  'collections',
  {
    id: text('id').primaryKey(), // UUID as text
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: text('name', { length: 100 }).notNull(),
    description: text('description'), // Collection description
    coverImageId: text('cover_image_id')
      .references(() => images.id, { onDelete: 'set null' }), // Nullable cover image
    isPublic: boolean('is_public').default(true).notNull(), // Public/private visibility
    imageCount: integer('image_count').default(0).notNull(), // Cached count of images
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }),
  },
  (table) => ({
    userIdIdx: index('collections_user_id_idx').on(table.userId),
    isPublicIdx: index('collections_is_public_idx').on(table.isPublic),
    createdAtIdx: index('collections_created_at_idx').on(table.createdAt),
  })
);

// CollectionImages junction table (many-to-many: collections <-> images)
export const collectionImages = pgTable(
  'collection_images',
  {
    id: text('id').primaryKey(), // UUID as text
    collectionId: text('collection_id')
      .notNull()
      .references(() => collections.id, { onDelete: 'cascade' }),
    imageId: text('image_id')
      .notNull()
      .references(() => images.id, { onDelete: 'cascade' }),
    addedAt: timestamp('added_at', { withTimezone: true }).defaultNow().notNull(),
    order: integer('order').default(0), // For custom ordering of images
  },
  (table) => ({
    collectionIdIdx: index('collection_images_collection_id_idx').on(table.collectionId),
    imageIdIdx: index('collection_images_image_id_idx').on(table.imageId),
    uniqueCollectionImage: unique('collection_images_unique_idx').on(table.collectionId, table.imageId),
  })
);

// Relations for collections
export const collectionsRelations = relations(collections, ({ one, many }) => ({
  user: one(users, {
    fields: [collections.userId],
    references: [users.id],
  }),
  coverImage: one(images, {
    fields: [collections.coverImageId],
    references: [images.id],
  }),
  collectionImages: many(collectionImages),
}));

// Relations for collectionImages
export const collectionImagesRelations = relations(collectionImages, ({ one }) => ({
  collection: one(collections, {
    fields: [collectionImages.collectionId],
    references: [collections.id],
  }),
  image: one(images, {
    fields: [collectionImages.imageId],
    references: [images.id],
  }),
}));

// Type exports for Collections

// Type exports for Collections
export type Collection = typeof collections.$inferSelect;
export type NewCollection = typeof collections.$inferInsert;
export type CollectionImage = typeof collectionImages.$inferSelect;
export type NewCollectionImage = typeof collectionImages.$inferInsert;