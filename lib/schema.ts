import { sqliteTable, text, integer, index, unique } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

// Users table
export const users = sqliteTable(
  'users',
  {
    id: text('id').primaryKey(),
    email: text('email', { length: 255 }).notNull().unique(),
    password: text('password', { length: 255 }),
    isActive: integer('is_active', { mode: 'boolean' }).default(0).notNull(),
    isAdmin: integer('is_admin', { mode: 'boolean' }).default(0).notNull(),
    name: text('name', { length: 100 }),
    avatar: text('avatar'),
    bio: text('bio'),
    location: text('location', { length: 100 }),
    website: text('website', { length: 255 }),
    instagram: text('instagram', { length: 100 }),
    twitter: text('twitter', { length: 100 }),
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
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    cosKey: text('cos_key').notNull(),
    exifData: text('exif_data', { mode: 'json' }),
    description: text('description'),
    location: text('location'),
    status: text('status', { enum: ['pending', 'approved', 'rejected'] })
      .default('pending')
      .notNull(),
    width: integer('width'),
    height: integer('height'),
    fileSize: integer('file_size'),
    fileHash: text('file_hash'),
    likes: integer('likes').default(0),
    downloads: integer('downloads').default(0),
    blurHash: text('blur_hash'),
    dominantColor: text('dominant_color'),
    createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
    updatedAt: integer('updated_at', { mode: 'timestamp' }),
  },
  (table) => ({
    userIdIdx: index('images_user_id_idx').on(table.userId),
    statusIdx: index('images_status_idx').on(table.status),
    createdAtIdx: index('images_created_at_idx').on(table.createdAt),
    fileHashIdx: index('images_file_hash_idx').on(table.fileHash),
  })
);

// Downloads table
export const downloads = sqliteTable(
  'downloads',
  {
    id: text('id').primaryKey(),
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

// Image embeddings table
export const imageEmbeddings = sqliteTable(
  'image_embeddings',
  {
    id: text('id').primaryKey(),
    imageId: text('image_id')
      .notNull()
      .references(() => images.id, { onDelete: 'cascade' }),
    embedding: text('embedding', { mode: 'json' }).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  },
  (table) => ({
    imageIdIdx: index('embeddings_image_id_idx').on(table.imageId),
  })
);

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

// Tags table
export const tags = sqliteTable(
  'tags',
  {
    id: text('id').primaryKey(),
    name: text('name', { length: 50 }).notNull().unique(),
    slug: text('slug', { length: 50 }).notNull().unique(),
    description: text('description'),
    color: text('color', { length: 7 }),
    imageCount: integer('image_count').default(0),
    createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  },
  (table) => ({
    nameIdx: index('tags_name_idx').on(table.name),
    slugIdx: index('tags_slug_idx').on(table.slug),
  })
);

// Image tags junction table
export const imageTags = sqliteTable(
  'image_tags',
  {
    id: text('id').primaryKey(),
    imageId: text('image_id')
      .notNull()
      .references(() => images.id, { onDelete: 'cascade' }),
    tagId: text('tag_id')
      .notNull()
      .references(() => tags.id, { onDelete: 'cascade' }),
    createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  },
  (table) => ({
    imageIdIdx: index('image_tags_image_id_idx').on(table.imageId),
    tagIdIdx: index('image_tags_tag_id_idx').on(table.tagId),
    uniqueIdx: unique('image_tags_unique_idx').on(table.imageId, table.tagId),
  })
);

// Collections table
export const collections = sqliteTable(
  'collections',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: text('name', { length: 100 }).notNull(),
    description: text('description'),
    coverImageId: text('cover_image_id').references(() => images.id, { onDelete: 'set null' }),
    isPublic: integer('is_public', { mode: 'boolean' }).default(1).notNull(),
    imageCount: integer('image_count').default(0),
    createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
    updatedAt: integer('updated_at', { mode: 'timestamp' }),
  },
  (table) => ({
    userIdIdx: index('collections_user_id_idx').on(table.userId),
    isPublicIdx: index('collections_is_public_idx').on(table.isPublic),
    createdAtIdx: index('collections_created_at_idx').on(table.createdAt),
  })
);

// Collection images junction table
export const collectionImages = sqliteTable(
  'collection_images',
  {
    id: text('id').primaryKey(),
    collectionId: text('collection_id')
      .notNull()
      .references(() => collections.id, { onDelete: 'cascade' }),
    imageId: text('image_id')
      .notNull()
      .references(() => images.id, { onDelete: 'cascade' }),
    addedAt: integer('added_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
    order: integer('order').default(0),
  },
  (table) => ({
    collectionIdIdx: index('collection_images_collection_id_idx').on(table.collectionId),
    imageIdIdx: index('collection_images_image_id_idx').on(table.imageId),
    uniqueIdx: unique('collection_images_unique_idx').on(table.collectionId, table.imageId),
  })
);

// Featured collections table
export const featuredCollections = sqliteTable(
  'featured_collections',
  {
    id: text('id').primaryKey(),
    title: text('title', { length: 100 }).notNull(),
    description: text('description'),
    coverImageId: text('cover_image_id').references(() => images.id, { onDelete: 'set null' }),
    curatorId: text('curator_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    displayOrder: integer('display_order').default(0),
    isActive: integer('is_active', { mode: 'boolean' }).default(1).notNull(),
    startDate: integer('start_date', { mode: 'timestamp' }),
    endDate: integer('end_date', { mode: 'timestamp' }),
    imageCount: integer('image_count').default(0),
    createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
    updatedAt: integer('updated_at', { mode: 'timestamp' }),
  },
  (table) => ({
    isActiveIdx: index('featured_collections_is_active_idx').on(table.isActive),
    orderIdx: index('featured_collections_order_idx').on(table.displayOrder),
    dateIdx: index('featured_collections_date_idx').on(table.startDate, table.endDate),
  })
);

// Featured collection images junction table
export const featuredCollectionImages = sqliteTable(
  'featured_collection_images',
  {
    id: text('id').primaryKey(),
    featuredCollectionId: text('featured_collection_id')
      .notNull()
      .references(() => featuredCollections.id, { onDelete: 'cascade' }),
    imageId: text('image_id')
      .notNull()
      .references(() => images.id, { onDelete: 'cascade' }),
    addedAt: integer('added_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
    order: integer('order').default(0),
  },
  (table) => ({
    collectionIdIdx: index('fc_images_collection_id_idx').on(table.featuredCollectionId),
    imageIdIdx: index('fc_images_image_id_idx').on(table.imageId),
  })
);

// Comments table
export const comments = sqliteTable(
  'comments',
  {
    id: text('id').primaryKey(),
    imageId: text('image_id')
      .notNull()
      .references(() => images.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    parentId: text('parent_id').references(() => comments.id, { onDelete: 'cascade' }),
    content: text('content').notNull(),
    status: text('status', { enum: ['pending', 'approved', 'rejected'] })
      .default('pending')
      .notNull(),
    likes: integer('likes').default(0),
    isEdited: integer('is_edited', { mode: 'boolean' }).default(0).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
    updatedAt: integer('updated_at', { mode: 'timestamp' }),
  },
  (table) => ({
    imageIdIdx: index('comments_image_id_idx').on(table.imageId),
    userIdIdx: index('comments_user_id_idx').on(table.userId),
    parentIdIdx: index('comments_parent_id_idx').on(table.parentId),
    statusIdx: index('comments_status_idx').on(table.status),
    createdAtIdx: index('comments_created_at_idx').on(table.createdAt),
  })
);

// Comment likes table
export const commentLikes = sqliteTable(
  'comment_likes',
  {
    id: text('id').primaryKey(),
    commentId: text('comment_id')
      .notNull()
      .references(() => comments.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  },
  (table) => ({
    commentIdIdx: index('comment_likes_comment_id_idx').on(table.commentId),
    userIdIdx: index('comment_likes_user_id_idx').on(table.userId),
    uniqueIdx: unique('comment_likes_unique_idx').on(table.commentId, table.userId),
  })
);

// Notifications table
export const notifications = sqliteTable(
  'notifications',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type', {
      enum: [
        'image_approved',
        'image_rejected',
        'new_comment',
        'comment_reply',
        'mention',
        'collection_add',
        'system',
      ],
    }).notNull(),
    title: text('title', { length: 200 }).notNull(),
    content: text('content'),
    relatedId: text('related_id'),
    relatedType: text('related_type', { length: 50 }),
    isRead: integer('is_read', { mode: 'boolean' }).default(0).notNull(),
    actionUrl: text('action_url'),
    createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  },
  (table) => ({
    userIdIdx: index('notifications_user_id_idx').on(table.userId),
    isReadIdx: index('notifications_is_read_idx').on(table.isRead),
    createdAtIdx: index('notifications_created_at_idx').on(table.createdAt),
    typeIdx: index('notifications_type_idx').on(table.type),
  })
);

// User preferences table
export const userPreferences = sqliteTable(
  'user_preferences',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' })
      .unique(),
    emailNotifications: integer('email_notifications', { mode: 'boolean' }).default(1),
    notifyOnComment: integer('notify_on_comment', { mode: 'boolean' }).default(1),
    notifyOnReply: integer('notify_on_reply', { mode: 'boolean' }).default(1),
    notifyOnFollow: integer('notify_on_follow', { mode: 'boolean' }).default(1),
    notifyOnImageStatus: integer('notify_on_image_status', { mode: 'boolean' }).default(1),
    updatedAt: integer('updated_at', { mode: 'timestamp' }),
  },
  (table) => ({
    userIdIdx: index('user_preferences_user_id_idx').on(table.userId),
  })
);

// Relations
export const imageEmbeddingsRelations = relations(imageEmbeddings, ({ one }) => ({
  image: one(images, {
    fields: [imageEmbeddings.imageId],
    references: [images.id],
  }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  images: many(images),
  downloads: many(downloads),
  collections: many(collections),
  comments: many(comments),
  notifications: many(notifications),
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
  comments: many(comments),
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

export const activationTokensRelations = relations(activationTokens, ({ one }) => ({
  user: one(users, {
    fields: [activationTokens.userId],
    references: [users.id],
  }),
}));

export const tagsRelations = relations(tags, ({ many }) => ({
  imageTags: many(imageTags),
}));

export const imageTagsRelations = relations(imageTags, ({ one }) => ({
  image: one(images, {
    fields: [imageTags.imageId],
    references: [images.id],
  }),
  tag: one(tags, {
    fields: [imageTags.tagId],
    references: [tags.id],
  }),
}));

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

export const featuredCollectionsRelations = relations(featuredCollections, ({ one, many }) => ({
  curator: one(users, {
    fields: [featuredCollections.curatorId],
    references: [users.id],
  }),
  coverImage: one(images, {
    fields: [featuredCollections.coverImageId],
    references: [images.id],
  }),
  featuredCollectionImages: many(featuredCollectionImages),
}));

export const featuredCollectionImagesRelations = relations(featuredCollectionImages, ({ one }) => ({
  featuredCollection: one(featuredCollections, {
    fields: [featuredCollectionImages.featuredCollectionId],
    references: [featuredCollections.id],
  }),
  image: one(images, {
    fields: [featuredCollectionImages.imageId],
    references: [images.id],
  }),
}));

export const commentsRelations = relations(comments, ({ one, many }) => ({
  image: one(images, {
    fields: [comments.imageId],
    references: [images.id],
  }),
  user: one(users, {
    fields: [comments.userId],
    references: [users.id],
  }),
  parent: one(comments, {
    fields: [comments.parentId],
    references: [comments.id],
  }),
  replies: many(comments),
  commentLikes: many(commentLikes),
}));

export const commentLikesRelations = relations(commentLikes, ({ one }) => ({
  comment: one(comments, {
    fields: [commentLikes.commentId],
    references: [comments.id],
  }),
  user: one(users, {
    fields: [commentLikes.userId],
    references: [users.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export const userPreferencesRelations = relations(userPreferences, ({ one }) => ({
  user: one(users, {
    fields: [userPreferences.userId],
    references: [users.id],
  }),
}));

// Type exports
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Image = typeof images.$inferSelect;
export type NewImage = typeof images.$inferInsert;
export type Download = typeof downloads.$inferSelect;
export type NewDownload = typeof downloads.$inferInsert;
export type ImageEmbedding = typeof imageEmbeddings.$inferSelect;
export type NewImageEmbedding = typeof imageEmbeddings.$inferInsert;
export type ActivationToken = typeof activationTokens.$inferSelect;
export type NewActivationToken = typeof activationTokens.$inferInsert;
export type Tag = typeof tags.$inferSelect;
export type NewTag = typeof tags.$inferInsert;
export type ImageTag = typeof imageTags.$inferSelect;
export type NewImageTag = typeof imageTags.$inferInsert;
export type Collection = typeof collections.$inferSelect;
export type NewCollection = typeof collections.$inferInsert;
export type CollectionImage = typeof collectionImages.$inferSelect;
export type NewCollectionImage = typeof collectionImages.$inferInsert;
export type FeaturedCollection = typeof featuredCollections.$inferSelect;
export type NewFeaturedCollection = typeof featuredCollections.$inferInsert;
export type FeaturedCollectionImage = typeof featuredCollectionImages.$inferSelect;
export type NewFeaturedCollectionImage = typeof featuredCollectionImages.$inferInsert;
export type Comment = typeof comments.$inferSelect;
export type NewComment = typeof comments.$inferInsert;
export type CommentLike = typeof commentLikes.$inferSelect;
export type NewCommentLike = typeof commentLikes.$inferInsert;
export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
export type UserPreference = typeof userPreferences.$inferSelect;
export type NewUserPreference = typeof userPreferences.$inferInsert;
