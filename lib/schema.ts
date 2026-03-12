import {
  pgTable,
  text,
  integer,
  index,
  timestamp,
  jsonb,
  boolean,
  unique,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Users table
export const users = pgTable(
  'users',
  {
    id: text('id').primaryKey(),
    email: text('email').notNull().unique(),
    password: text('password'),
    isActive: boolean('is_active').default(false).notNull(),
    isAdmin: boolean('is_admin').default(false).notNull(),
    name: text('name'),
    avatar: text('avatar'),
    bio: text('bio'),
    location: text('location'),
    website: text('website'),
    instagram: text('instagram'),
    twitter: text('twitter'),
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
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    cosKey: text('cos_key').notNull(),
    exifData: jsonb('exif_data'),
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
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }),
  },
  (table) => ({
    userIdIdx: index('images_user_id_idx').on(table.userId),
    statusIdx: index('images_status_idx').on(table.status),
    createdAtIdx: index('images_created_at_idx').on(table.createdAt),
    fileHashIdx: index('images_file_hash_idx').on(table.fileHash),
  })
);

// Downloads table
export const downloads = pgTable(
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
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    imageIdIdx: index('downloads_image_id_idx').on(table.imageId),
    userIdIdx: index('downloads_user_id_idx').on(table.userId),
    createdAtIdx: index('downloads_created_at_idx').on(table.createdAt),
  })
);

// Image embeddings table
export const imageEmbeddings = pgTable(
  'image_embeddings',
  {
    id: text('id').primaryKey(),
    imageId: text('image_id')
      .notNull()
      .references(() => images.id, { onDelete: 'cascade' }),
    embedding: jsonb('embedding').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    imageIdIdx: index('embeddings_image_id_idx').on(table.imageId),
  })
);

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

// Tags table
export const tags = pgTable(
  'tags',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull().unique(),
    slug: text('slug').notNull().unique(),
    description: text('description'),
    color: text('color'),
    imageCount: integer('image_count').default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    nameIdx: index('tags_name_idx').on(table.name),
    slugIdx: index('tags_slug_idx').on(table.slug),
  })
);

// Image tags junction table
export const imageTags = pgTable(
  'image_tags',
  {
    id: text('id').primaryKey(),
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
    uniqueIdx: unique('image_tags_unique_idx').on(table.imageId, table.tagId),
  })
);

// Collections table
export const collections = pgTable(
  'collections',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description'),
    coverImageId: text('cover_image_id').references(() => images.id, { onDelete: 'set null' }),
    isPublic: boolean('is_public').default(true).notNull(),
    imageCount: integer('image_count').default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }),
  },
  (table) => ({
    userIdIdx: index('collections_user_id_idx').on(table.userId),
    isPublicIdx: index('collections_is_public_idx').on(table.isPublic),
    createdAtIdx: index('collections_created_at_idx').on(table.createdAt),
  })
);

// Collection images junction table
export const collectionImages = pgTable(
  'collection_images',
  {
    id: text('id').primaryKey(),
    collectionId: text('collection_id')
      .notNull()
      .references(() => collections.id, { onDelete: 'cascade' }),
    imageId: text('image_id')
      .notNull()
      .references(() => images.id, { onDelete: 'cascade' }),
    addedAt: timestamp('added_at', { withTimezone: true }).defaultNow().notNull(),
    order: integer('order').default(0),
  },
  (table) => ({
    collectionIdIdx: index('collection_images_collection_id_idx').on(table.collectionId),
    imageIdIdx: index('collection_images_image_id_idx').on(table.imageId),
    uniqueIdx: unique('collection_images_unique_idx').on(table.collectionId, table.imageId),
  })
);

// Featured collections table
export const featuredCollections = pgTable(
  'featured_collections',
  {
    id: text('id').primaryKey(),
    title: text('title').notNull(),
    description: text('description'),
    coverImageId: text('cover_image_id').references(() => images.id, { onDelete: 'set null' }),
    curatorId: text('curator_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    displayOrder: integer('display_order').default(0),
    isActive: boolean('is_active').default(true).notNull(),
    startDate: timestamp('start_date', { withTimezone: true }),
    endDate: timestamp('end_date', { withTimezone: true }),
    imageCount: integer('image_count').default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }),
  },
  (table) => ({
    isActiveIdx: index('featured_collections_is_active_idx').on(table.isActive),
    orderIdx: index('featured_collections_order_idx').on(table.displayOrder),
    dateIdx: index('featured_collections_date_idx').on(table.startDate, table.endDate),
  })
);

// Featured collection images junction table
export const featuredCollectionImages = pgTable(
  'featured_collection_images',
  {
    id: text('id').primaryKey(),
    featuredCollectionId: text('featured_collection_id')
      .notNull()
      .references(() => featuredCollections.id, { onDelete: 'cascade' }),
    imageId: text('image_id')
      .notNull()
      .references(() => images.id, { onDelete: 'cascade' }),
    addedAt: timestamp('added_at', { withTimezone: true }).defaultNow().notNull(),
    order: integer('order').default(0),
  },
  (table) => ({
    collectionIdIdx: index('fc_images_collection_id_idx').on(table.featuredCollectionId),
    imageIdIdx: index('fc_images_image_id_idx').on(table.imageId),
  })
);

// Comments table
export const comments: any = pgTable(
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
    isEdited: boolean('is_edited').default(false).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }),
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
export const commentLikes = pgTable(
  'comment_likes',
  {
    id: text('id').primaryKey(),
    commentId: text('comment_id')
      .notNull()
      .references(() => comments.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    commentIdIdx: index('comment_likes_comment_id_idx').on(table.commentId),
    userIdIdx: index('comment_likes_user_id_idx').on(table.userId),
    uniqueIdx: unique('comment_likes_unique_idx').on(table.commentId, table.userId),
  })
);

// Notifications table
export const notifications = pgTable(
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
    title: text('title').notNull(),
    content: text('content'),
    relatedId: text('related_id'),
    relatedType: text('related_type'),
    isRead: boolean('is_read').default(false).notNull(),
    actionUrl: text('action_url'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('notifications_user_id_idx').on(table.userId),
    isReadIdx: index('notifications_is_read_idx').on(table.isRead),
    createdAtIdx: index('notifications_created_at_idx').on(table.createdAt),
    typeIdx: index('notifications_type_idx').on(table.type),
  })
);

// User preferences table
export const userPreferences = pgTable(
  'user_preferences',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' })
      .unique(),
    emailNotifications: boolean('email_notifications').default(true),
    notifyOnComment: boolean('notify_on_comment').default(true),
    notifyOnReply: boolean('notify_on_reply').default(true),
    notifyOnFollow: boolean('notify_on_follow').default(true),
    notifyOnImageStatus: boolean('notify_on_image_status').default(true),
    updatedAt: timestamp('updated_at', { withTimezone: true }),
  },
  (table) => ({
    userIdIdx: index('user_preferences_user_id_idx').on(table.userId),
  })
);

// Image views table (for analytics)
export const imageViews = pgTable(
  'image_views',
  {
    id: text('id').primaryKey(),
    imageId: text('image_id')
      .notNull()
      .references(() => images.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .references(() => users.id, { onDelete: 'cascade' }),
    sessionId: text('session_id'),
    ipHash: text('ip_hash'),
    userAgent: text('user_agent'),
    referrer: text('referrer'),
    viewedAt: timestamp('viewed_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    imageIdIdx: index('image_views_image_id_idx').on(table.imageId),
    userIdIdx: index('image_views_user_id_idx').on(table.userId),
    sessionIdIdx: index('image_views_session_id_idx').on(table.sessionId),
    viewedAtIdx: index('image_views_viewed_at_idx').on(table.viewedAt),
  })
);

// Image view aggregates table (daily stats)
export const imageViewAggregates = pgTable(
  'image_view_aggregates',
  {
    id: text('id').primaryKey(),
    imageId: text('image_id')
      .notNull()
      .references(() => images.id, { onDelete: 'cascade' }),
    date: timestamp('date', { withTimezone: true }).notNull(),
    totalViews: integer('total_views').default(0),
    uniqueViews: integer('unique_views').default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }),
  },
  (table) => ({
    imageIdIdx: index('image_view_aggregates_image_id_idx').on(table.imageId),
    dateIdx: index('image_view_aggregates_date_idx').on(table.date),
    uniqueIdx: unique('image_view_aggregates_unique_idx').on(table.imageId, table.date),
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

export const imageViewAggregatesRelations = relations(imageViewAggregates, ({ one }) => ({
  image: one(images, {
    fields: [imageViewAggregates.imageId],
    references: [images.id],
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
export type ImageView = typeof imageViews.$inferSelect;
export type NewImageView = typeof imageViews.$inferInsert;
export type ImageViewAggregate = typeof imageViewAggregates.$inferSelect;
export type NewImageViewAggregate = typeof imageViewAggregates.$inferInsert;
